import json
from collections.abc import Awaitable, Callable

from predict_mv_daemon.api import ApiClient


class ControlChannelClient:
    def __init__(
        self,
        *,
        api_client: ApiClient,
        machine_token: str,
        on_connected: Callable[[], Awaitable[None]],
        on_event: Callable[[dict], Awaitable[None]],
    ) -> None:
        self.api_client = api_client
        self.machine_token = machine_token
        self.on_connected = on_connected
        self.on_event = on_event

    async def run(self) -> None:
        import websockets

        async with websockets.connect(
            self.api_client.websocket_url(machine_token=self.machine_token),
            ping_interval=20,
            ping_timeout=20,
            close_timeout=5,
        ) as websocket:
            await self.on_connected()
            async for raw_message in websocket:
                if isinstance(raw_message, bytes):
                    raw_message = raw_message.decode("utf-8", errors="replace")
                await self.on_event(json.loads(raw_message))
