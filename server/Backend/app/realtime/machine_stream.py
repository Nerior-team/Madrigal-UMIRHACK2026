import asyncio

from fastapi import WebSocket


class MachineConnectionRegistry:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, *, machine_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(machine_id, set()).add(websocket)

    async def disconnect(self, *, machine_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(machine_id)
            if sockets is None:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(machine_id, None)

    async def send_json(self, *, machine_id: str, message: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(machine_id, set()))
        stale: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            await self.disconnect(machine_id=machine_id, websocket=websocket)


machine_stream = MachineConnectionRegistry()
