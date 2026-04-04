import asyncio
import signal
import time
from datetime import datetime, timezone

from predict_mv_daemon.api import ApiClient, ApiError
from predict_mv_daemon.control import ControlChannelClient
from predict_mv_daemon.executor import RunningAttempt, build_process_args, decode_chunk, terminate_process
from predict_mv_daemon.models import ClaimedTask, DaemonState
from predict_mv_daemon.state import StateStore


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DaemonRuntime:
    def __init__(self, state: DaemonState, *, state_store: StateStore | None = None) -> None:
        self.state = state
        self.state_store = state_store or StateStore()
        self.api_client = ApiClient(state.backend_base_url)
        self.active_attempts: dict[str, RunningAttempt] = {}
        self.pending_cancellations: set[str] = set()
        self.claim_event = asyncio.Event()
        self.stop_event = asyncio.Event()

    async def run(self) -> None:
        if not self.state.is_paired or not self.state.machine_token:
            raise RuntimeError("Daemon is not paired")
        await self._sync_identity()
        self._install_signal_handlers()
        self.claim_event.set()
        await asyncio.gather(
            self._heartbeat_loop(),
            self._claim_loop(),
            self._control_loop(),
        )

    def _install_signal_handlers(self) -> None:
        loop = asyncio.get_running_loop()
        for signame in ("SIGINT", "SIGTERM"):
            sig = getattr(signal, signame, None)
            if sig is None:
                continue
            try:
                loop.add_signal_handler(sig, self.stop_event.set)
            except NotImplementedError:
                pass

    async def _heartbeat_loop(self) -> None:
        while not self.stop_event.is_set():
            try:
                await asyncio.to_thread(
                    self.api_client.send_heartbeat,
                    machine_token=self.state.machine_token,
                    agent_version=self.state.agent_version,
                    status_payload={"active_tasks": len(self.active_attempts)},
                )
                self.state.last_heartbeat_at = _utc_now_iso()
                self._persist_state()
            except ApiError as exc:
                if await self._handle_api_error(exc, reason="heartbeat_failed"):
                    break
            except Exception:
                self._set_connection_status("degraded")
            try:
                await asyncio.wait_for(self.stop_event.wait(), timeout=self.state.heartbeat_interval_seconds)
            except asyncio.TimeoutError:
                pass

    async def _control_loop(self) -> None:
        backoff_seconds = 2
        while not self.stop_event.is_set():
            try:
                client = ControlChannelClient(
                    api_client=self.api_client,
                    machine_token=self.state.machine_token or "",
                    on_connected=self._on_connected,
                    on_event=self._on_control_event,
                )
                await client.run()
                backoff_seconds = 2
            except ApiError as exc:
                if await self._handle_api_error(exc, reason="control_channel_denied"):
                    break
            except Exception:
                if self.stop_event.is_set():
                    break
                self._set_connection_status("degraded")
                await asyncio.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, 15)

    async def _on_connected(self) -> None:
        self.state.last_control_connect_at = _utc_now_iso()
        self._persist_state()
        await self._sync_identity()
        if self.stop_event.is_set():
            raise RuntimeError("Agent access revoked")
        self.claim_event.set()

    async def _on_control_event(self, event: dict) -> None:
        event_type = event.get("type")
        payload = event.get("payload", {})
        if event_type == "task_available":
            self.claim_event.set()
            return
        if event_type == "task_cancel":
            await self._cancel_attempt(payload.get("attempt_id"))
            return
        if event_type == "config_updated":
            await self._sync_identity()
            self.claim_event.set()
            return
        if event_type == "access_revoked":
            await self._shutdown_running_attempts()
            self.state.clear_pairing(
                reason=payload.get("reason"),
                cleared_at=_utc_now_iso(),
                status="revoked",
            )
            self._persist_state()
            self.stop_event.set()
            raise RuntimeError("Agent access revoked")

    async def _shutdown_running_attempts(self) -> None:
        for handle in list(self.active_attempts.values()):
            handle.cancel_requested = True
            await terminate_process(handle.process)

    async def _claim_loop(self) -> None:
        while not self.stop_event.is_set():
            await self.claim_event.wait()
            self.claim_event.clear()
            while not self.stop_event.is_set():
                if not self.state.is_paired or not self.state.machine_token:
                    break
                try:
                    claimed = await asyncio.to_thread(self.api_client.claim_task, machine_token=self.state.machine_token)
                except ApiError as exc:
                    if await self._handle_api_error(exc, reason="claim_denied"):
                        return
                    break
                except Exception:
                    self._set_connection_status("degraded")
                    break
                if claimed is None:
                    break
                if claimed.attempt_id in self.active_attempts:
                    continue
                handle = RunningAttempt(task=claimed)
                if claimed.attempt_id in self.pending_cancellations:
                    handle.cancel_requested = True
                    self.pending_cancellations.discard(claimed.attempt_id)
                self.active_attempts[claimed.attempt_id] = handle
                asyncio.create_task(self._execute_attempt(handle))

    async def _cancel_attempt(self, attempt_id: str | None) -> None:
        if not attempt_id:
            return
        handle = self.active_attempts.get(attempt_id)
        if handle is None:
            self.pending_cancellations.add(attempt_id)
            return
        handle.cancel_requested = True
        await terminate_process(handle.process)

    async def _execute_attempt(self, handle: RunningAttempt) -> None:
        attempt_id = handle.task.attempt_id
        started_at = time.perf_counter()
        try:
            await asyncio.to_thread(
                self.api_client.mark_accepted,
                machine_token=self.state.machine_token,
                attempt_id=attempt_id,
            )
            await asyncio.to_thread(
                self.api_client.update_progress,
                machine_token=self.state.machine_token or "",
                attempt_id=attempt_id,
                message="Executing command",
                percent=10,
            )
            args = build_process_args(
                os_family=self.state.os_family,
                allowed_runners=self.state.allowed_runners,
                runner=handle.task.runner,
                command=handle.task.command,
            )
            handle.process = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            if handle.cancel_requested:
                await terminate_process(handle.process)

            await asyncio.gather(
                self._pump_stream(handle, stream_name="stdout", reader=handle.process.stdout),
                self._pump_stream(handle, stream_name="stderr", reader=handle.process.stderr),
            )
            exit_code = await handle.process.wait()
            duration_ms = int((time.perf_counter() - started_at) * 1000)
            stdout = "".join(handle.stdout_parts)
            stderr = "".join(handle.stderr_parts)
            if handle.cancel_requested:
                await asyncio.to_thread(
                    self.api_client.submit_failure,
                    machine_token=self.state.machine_token or "",
                    attempt_id=attempt_id,
                    error_kind="cancelled",
                    error_message="Task cancelled by operator",
                    stdout=stdout,
                    stderr=stderr,
                    duration_ms=duration_ms,
                )
            elif exit_code == 0:
                await asyncio.to_thread(
                    self.api_client.submit_result,
                    machine_token=self.state.machine_token or "",
                    attempt_id=attempt_id,
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    duration_ms=duration_ms,
                )
            else:
                await asyncio.to_thread(
                    self.api_client.submit_failure,
                    machine_token=self.state.machine_token or "",
                    attempt_id=attempt_id,
                    error_kind="permanent",
                    error_message=f"Command exited with code {exit_code}",
                    stdout=stdout,
                    stderr=stderr,
                    duration_ms=duration_ms,
                )
        except ApiError:
            pass
        except Exception as exc:
            duration_ms = int((time.perf_counter() - started_at) * 1000)
            await asyncio.to_thread(
                self.api_client.submit_failure,
                machine_token=self.state.machine_token or "",
                attempt_id=attempt_id,
                error_kind="transient",
                error_message=str(exc),
                stdout="".join(handle.stdout_parts),
                stderr="".join(handle.stderr_parts),
                duration_ms=duration_ms,
            )
        finally:
            self.active_attempts.pop(attempt_id, None)
            self.claim_event.set()

    async def _pump_stream(self, handle: RunningAttempt, *, stream_name: str, reader) -> None:
        if reader is None:
            return
        while True:
            raw = await reader.readline()
            if not raw:
                break
            chunk = decode_chunk(raw)
            if stream_name == "stdout":
                handle.stdout_parts.append(chunk)
            else:
                handle.stderr_parts.append(chunk)
            sequence = handle.next_sequence
            handle.next_sequence += 1
            await asyncio.to_thread(
                self.api_client.append_log,
                machine_token=self.state.machine_token or "",
                attempt_id=handle.task.attempt_id,
                stream=stream_name,
                sequence=sequence,
                chunk=chunk,
            )

    async def _sync_identity(self) -> None:
        if not self.state.machine_token:
            raise RuntimeError("Daemon is not paired")
        try:
            identity = await asyncio.to_thread(
                self.api_client.get_agent_identity,
                machine_token=self.state.machine_token,
            )
        except ApiError as exc:
            if await self._handle_api_error(exc, reason="identity_denied"):
                return
            raise
        self.state.sync_identity(identity, synced_at=_utc_now_iso())
        self._persist_state()

    async def _handle_api_error(self, exc: ApiError, *, reason: str) -> bool:
        if exc.status_code == 401:
            await self._shutdown_running_attempts()
            self.state.clear_pairing(reason=reason, cleared_at=_utc_now_iso(), status="revoked")
            self._persist_state()
            self.stop_event.set()
            return True
        self._set_connection_status("degraded")
        return False

    def _set_connection_status(self, status: str) -> None:
        self.state.set_connection_status(status)
        self._persist_state()

    def _persist_state(self) -> None:
        self.state_store.save(self.state)
