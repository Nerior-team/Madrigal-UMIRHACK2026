import asyncio

from predict_mv_daemon.runtime import DaemonRuntime
from predict_mv_daemon.state import StateStore


def main() -> int:
    store = StateStore()
    if not store.exists():
        print("Daemon is not paired.")
        return 1
    state = store.load()
    if not state.is_paired:
        print("Daemon is not paired.")
        return 1
    try:
        asyncio.run(DaemonRuntime(state, state_store=store).run())
    except KeyboardInterrupt:
        return 0
    return 0
