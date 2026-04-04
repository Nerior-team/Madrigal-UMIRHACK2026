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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="predict-mv-daemon-cli")
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
    return parser


def pair_command(args: argparse.Namespace) -> int:
    store = StateStore(args.state_path)
    if store.exists():
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
    api = ApiClient(state.backend_base_url)
    identity = api.get_agent_identity(machine_token=state.machine_token)
    print(f"Machine ID: {identity.machine_id}")
    print(f"Display name: {identity.display_name}")
    print(f"Hostname: {identity.hostname}")
    print(f"OS: {identity.os_family} {identity.os_version or ''}".strip())
    print(f"Status: {identity.status}")
    print(f"Concurrency limit: {identity.concurrency_limit}")
    return 0


def unpair_command(args: argparse.Namespace) -> int:
    store = StateStore(args.state_path)
    if not store.exists():
        print("Daemon is not paired.")
        return 1
    state = store.load()
    if not args.local_only:
        api = ApiClient(state.backend_base_url)
        api.unpair(machine_token=state.machine_token)
    store.clear()
    print("Daemon unpaired.")
    return 0


def run_command(args: argparse.Namespace) -> int:
    if args.state_path is not None:
        store = StateStore(args.state_path)
        if not store.exists():
            print("Daemon is not paired.")
            return 1
        state = store.load()
        try:
            asyncio.run(__import__("predict_mv_daemon.runtime", fromlist=["DaemonRuntime"]).DaemonRuntime(state).run())
        except KeyboardInterrupt:
            return 0
        return 0
    return daemon_main()


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
        parser.error("Unknown command")
        return 2
    except ApiError as exc:
        print(str(exc), file=sys.stderr)
        return 1

