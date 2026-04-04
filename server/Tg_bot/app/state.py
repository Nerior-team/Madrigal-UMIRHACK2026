from __future__ import annotations

import json
import secrets

from redis.asyncio import Redis


class BotStateStore:
    def __init__(self, redis: Redis, *, ttl_seconds: int) -> None:
        self.redis = redis
        self.ttl_seconds = ttl_seconds

    @classmethod
    def build(cls, *, host: str, port: int, ttl_seconds: int) -> "BotStateStore":
        return cls(Redis(host=host, port=port, decode_responses=True), ttl_seconds=ttl_seconds)

    async def close(self) -> None:
        await self.redis.aclose()

    async def create_run_state(self, payload: dict) -> str:
        state_id = secrets.token_urlsafe(8)
        await self.redis.setex(self._key(state_id), self.ttl_seconds, json.dumps(payload))
        return state_id

    async def get_run_state(self, state_id: str) -> dict | None:
        raw = await self.redis.get(self._key(state_id))
        if not raw:
            return None
        return json.loads(raw)

    async def save_run_state(self, state_id: str, payload: dict) -> None:
        await self.redis.setex(self._key(state_id), self.ttl_seconds, json.dumps(payload))

    async def delete_run_state(self, state_id: str) -> None:
        await self.redis.delete(self._key(state_id))

    def _key(self, state_id: str) -> str:
        return f"tg_bot:run_state:{state_id}"
