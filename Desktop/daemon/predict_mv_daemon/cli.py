import argparse
import asyncio
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from predict_mv_daemon import __version__
from predict_mv_daemon.api import ApiClient, ApiError
from predict_mv_daemon.daemon_main import main as daemon_main
from predict_mv_daemon.models import DaemonState
from predict_mv_daemon.state import StateStore
from predict_mv_daemon.system import default_hostname, default_os_version, detect_os_family
from predict_mv_daemon.updates import apply_update, check_for_update, pretty_manifest_url


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="predict")
    parser.add_argument("--state-path", type=Path, default=None)
    subparsers = parser.add_subparsers(dest="command", required=True)

    pair = subparsers.add_parser("pair")
    pair.add_argument("--backend-url", required=True)
    pair.add_argument("--display-name", default=None)
    pair.add_argument("--timeout-seconds", type=int, default=300)
    pair.add_argument("--poll-interval-seconds", type=int, default=5)

    subparsers.add_parser("status")

    unpair = subparsers.add_parser("unpair")
    unpair.add_argument("--local-only", action="store_true")

    subparsers.add_parser("run")
    subparsers.add_parser("version")

    update = subparsers.add_parser("update")
    update_subparsers = update.add_subparsers(dest="update_command", required=True)

    update_check = update_subparsers.add_parser("check")
    update_check.add_argument("--backend-url", default=None)

    update_apply = update_subparsers.add_parser("apply")
    update_apply.add_argument("--backend-url", default=None)

    update_internal = update_subparsers.add_parser("apply-internal", help=argparse.SUPPRESS)
    update_internal.add_argument("--backend-url", default=None)
    return parser


def pair_command(args: argparse.Namespace) -> int:
    store = StateStore(args.state_path)
    if store.exists():
        existing = store.load()
        if existing.is_paired:
            print("Daemon is already paired. Unpair it first.")
            return 1

    api = ApiClient(args.backend_url)
    registration = api.start_registration(
        hostname=default_hostname(),
        display_name=args.display_name,
        os_family=detect_os_family(),
        os_version=default_os_version(),
        agent_version=__version__,
    )
    print(f"Device code: {registration.device_code}")
    print("Confirm this machine in Predict MV, then wait for pairing to complete.")

    deadline = time.time() + args.timeout_seconds
    while time.time() < deadline:
        try:
            completed = api.complete_registration(
                registration_id=registration.registration_id,
                registration_token=registration.registration_token,
            )
            state = DaemonState(
                backend_base_url=args.backend_url.rstrip("/"),
                machine_id=completed["machine_id"],
                machine_token=completed["machine_token"],
                agent_version=__version__,
                paired_at=datetime.now(timezone.utc).isoformat(),
                os_family=detect_os_family(),
                connection_status="connecting",
            )
            store.save(state)
            print(f"Paired machine: {state.machine_id}")
            return 0
        except ApiError as exc:
            if exc.status_code == 409:
                time.sleep(args.poll_interval_seconds)
                continue
            raise

    print("Pairing timed out.")
    return 1


def status_command(args: argparse.Namespace) -> int:
    store = StateStore(args.state_path)
    if not store.exists():
        print("Daemon is not paired.")
        return 1
    state = store.load()
    print(f"Connection: {state.connection_status}")
    print(f"Machine ID: {state.machine_id or '-'}")
    if state.last_heartbeat_at:
        print(f"Last heartbeat: {state.last_heartbeat_at}")
    if state.last_config_sync_at:
        print(f"Last config sync: {state.last_config_sync_at}")
    if state.last_control_connect_at:
        print(f"Last control connect: {state.last_control_connect_at}")
    if state.revoked_reason:
        print(f"Revoked reason: {state.revoked_reason}")
    if not state.is_paired:
        print("Daemon is not paired.")
        return 0

    api = ApiClient(state.backend_base_url)
    identity = api.get_agent_identity(machine_token=state.machine_token)
    print(f"Display name: {identity.display_name}")
    print(f"Hostname: {identity.hostname}")
    print(f"OS: {identity.os_family} {identity.os_version or ''}".strip())
    print(f"Status: {identity.status}")
    print(f"Concurrency limit: {identity.concurrency_limit}")
    print(f"Allowed runners: {', '.join(identity.allowed_runners)}")
    return 0


def unpair_command(args: argparse.Namespace) -> int:
    store = StateStore(args.state_path)
    if not store.exists():
        print("Daemon is not paired.")
        return 1
    state = store.load()
    if not args.local_only and state.is_paired and state.machine_token:
        api = ApiClient(state.backend_base_url)
        api.unpair(machine_token=state.machine_token)
    state.clear_pairing(reason="local_unpair", cleared_at=datetime.now(timezone.utc).isoformat(), status="stopped")
    store.save(state)
    print("Daemon unpaired.")
    return 0


def run_command(args: argparse.Namespace) -> int:
    if args.state_path is not None:
        store = StateStore(args.state_path)
        if not store.exists():
            print("Daemon is not paired.")
            return 1
        state = store.load()
        if not state.is_paired:
            print("Daemon is not paired.")
            return 1
        try:
            asyncio.run(
                __import__("predict_mv_daemon.runtime", fromlist=["DaemonRuntime"]).DaemonRuntime(
                    state,
                    state_store=store,
                ).run()
            )
        except KeyboardInterrupt:
            return 0
        return 0
    return daemon_main()


def version_command() -> int:
    print(__version__)
    return 0


def _resolve_backend_url(args: argparse.Namespace) -> str:
    if getattr(args, "backend_url", None):
        return str(args.backend_url).rstrip("/")
    store = StateStore(args.state_path)
    if not store.exists():
        raise RuntimeError("Backend URL is required when daemon state is missing.")
    state = store.load()
    if not state.backend_base_url:
        raise RuntimeError("Backend URL is required when daemon state has no backend URL.")
    return state.backend_base_url.rstrip("/")


def update_check_command(args: argparse.Namespace) -> int:
    backend_url = _resolve_backend_url(args)
    manifest = check_for_update(backend_url, current_version=__version__)
    if manifest is None:
        print(f"Already up to date. Current version: {__version__}")
        print(f"Manifest: {pretty_manifest_url(backend_url)}")
        return 0
    print(f"Update available: {manifest.version}")
    print(f"Current version: {__version__}")
    print(f"Manifest: {pretty_manifest_url(backend_url)}")
    return 0


def update_apply_command(args: argparse.Namespace) -> int:
    backend_url = _resolve_backend_url(args)
    changed, message = apply_update(backend_url, current_version=__version__)
    print(message)
    return 0 if changed else 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command == "pair":
            return pair_command(args)
        if args.command == "status":
            return status_command(args)
        if args.command == "unpair":
            return unpair_command(args)
        if args.command == "run":
            return run_command(args)
        if args.command == "version":
            return version_command()
        if args.command == "update":
            if args.update_command == "check":
                return update_check_command(args)
            if args.update_command == "apply":
                return update_apply_command(args)
            if args.update_command == "apply-internal":
                return update_apply_command(args)
        parser.error("Unknown command")
        return 2
    except (ApiError, RuntimeError, PermissionError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
