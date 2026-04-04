import asyncio
import concurrent.futures
from dataclasses import dataclass

from fastapi import WebSocket


@dataclass(frozen=True, slots=True)
class MachineSocket:
    websocket: WebSocket
    loop: asyncio.AbstractEventLoop


class MachineConnectionRegistry:
    def __init__(self) -> None:
        self._connections: dict[str, set[MachineSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, *, machine_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        connection = MachineSocket(websocket=websocket, loop=asyncio.get_running_loop())
        async with self._lock:
            self._connections.setdefault(machine_id, set()).add(connection)

    async def disconnect(self, *, machine_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(machine_id)
            if sockets is None:
                return
            sockets = {item for item in sockets if item.websocket is not websocket}
            if sockets:
                self._connections[machine_id] = sockets
            else:
                self._connections.pop(machine_id, None)

    async def send_json(self, *, machine_id: str, message: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(machine_id, set()))
        stale: list[WebSocket] = []
        for connection in sockets:
            try:
                await connection.websocket.send_json(message)
            except Exception:
                stale.append(connection.websocket)
        for websocket in stale:
            await self.disconnect(machine_id=machine_id, websocket=websocket)

    def send_json_sync(self, *, machine_id: str, message: dict) -> None:
        connections = list(self._connections.get(machine_id, set()))
        for connection in connections:
            try:
                future = asyncio.run_coroutine_threadsafe(connection.websocket.send_json(message), connection.loop)
                future.result(timeout=1)
            except (Exception, concurrent.futures.TimeoutError):
                continue


machine_stream = MachineConnectionRegistry()
