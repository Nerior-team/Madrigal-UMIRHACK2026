import asyncio
import os
import sys
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


def build_process_args(*, runner: str, command: str) -> list[str]:
    if runner == "powershell":
        if os.name != "nt":
            raise RuntimeError("PowerShell runner is only supported on Windows")
        return ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command]
    if os.name == "nt":
        return ["cmd.exe", "/c", command]
    return ["/bin/sh", "-lc", command]


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
