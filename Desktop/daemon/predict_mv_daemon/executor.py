import asyncio
import os
from dataclasses import dataclass, field

from predict_mv_daemon.models import ClaimedTask


@dataclass(slots=True)
class RunningAttempt:
    task: ClaimedTask
    process: asyncio.subprocess.Process | None = None
    cancel_requested: bool = False
    stdout_parts: list[str] = field(default_factory=list)
    stderr_parts: list[str] = field(default_factory=list)
    next_sequence: int = 1


def ensure_runner_allowed(*, os_family: str | None, allowed_runners: list[str], runner: str) -> None:
    normalized_allowed = {value.strip().lower() for value in allowed_runners if value.strip()}
    normalized_runner = runner.strip().lower()
    normalized_os = (os_family or "").strip().lower()

    if normalized_allowed and normalized_runner not in normalized_allowed:
        raise RuntimeError(f"Runner '{runner}' is not allowed for this machine")
    if normalized_os == "windows" and normalized_runner != "powershell":
        raise RuntimeError("Windows machine can execute only PowerShell runner")
    if normalized_os in {"linux", "macos"} and normalized_runner != "shell":
        raise RuntimeError("Unix-like machine can execute only shell runner")
    if normalized_os not in {"windows", "linux", "macos"}:
        raise RuntimeError("Machine OS is not supported for command execution")


def build_process_args(*, os_family: str | None, allowed_runners: list[str], runner: str, command: str) -> list[str]:
    ensure_runner_allowed(os_family=os_family, allowed_runners=allowed_runners, runner=runner)
    if runner == "powershell":
        if os.name != "nt":
            raise RuntimeError("PowerShell runner is only supported on Windows")
        return ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command]
    if runner == "shell":
        if os.name == "nt":
            raise RuntimeError("Shell runner is not supported on Windows daemon")
        return ["/bin/sh", "-lc", command]
    raise RuntimeError(f"Unsupported runner: {runner}")


async def terminate_process(process: asyncio.subprocess.Process | None) -> None:
    if process is None or process.returncode is not None:
        return
    process.terminate()
    try:
        await asyncio.wait_for(process.wait(), timeout=5)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()


def decode_chunk(raw: bytes) -> str:
    return raw.decode("utf-8", errors="replace")
