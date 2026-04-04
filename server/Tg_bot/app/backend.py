from __future__ import annotations

from typing import Any

import httpx


class BackendClient:
    def __init__(self, *, base_url: str, telegram_secret: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            headers={"X-Telegram-Secret": telegram_secret},
            timeout=15.0,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def _request(self, method: str, path: str, **kwargs) -> Any:
        response = await self._client.request(method, path, **kwargs)
        if response.is_success:
            if response.status_code == 204 or not response.content:
                return None
            return response.json()

        message = "Backend error"
        try:
            payload = response.json()
            message = payload.get("error", {}).get("message", message)
        except Exception:
            message = response.text or message
        raise RuntimeError(message)

    async def start(self, *, telegram_user_id: str, telegram_chat_id: str, telegram_username: str | None, telegram_first_name: str | None, deep_link_payload: str | None) -> dict:
        return await self._request(
            "POST",
            "/api/v1/integrations/telegram/bot/start",
            json={
                "telegram_user_id": telegram_user_id,
                "telegram_chat_id": telegram_chat_id,
                "telegram_username": telegram_username,
                "telegram_first_name": telegram_first_name,
                "deep_link_payload": deep_link_payload,
            },
        )

    async def get_profile(self, telegram_user_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/profile")

    async def list_machines(self, telegram_user_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/machines")

    async def get_machine(self, telegram_user_id: str, machine_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/machines/{machine_id}")

    async def list_commands(self, telegram_user_id: str, machine_id: str) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/machines/{machine_id}/commands",
        )

    async def list_tasks(self, telegram_user_id: str, machine_id: str) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/machines/{machine_id}/tasks",
        )

    async def create_task(self, telegram_user_id: str, *, machine_id: str, template_key: str, params: dict[str, str]) -> dict:
        return await self._request(
            "POST",
            f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/tasks",
            json={"machine_id": machine_id, "template_key": template_key, "params": params},
        )

    async def get_task(self, telegram_user_id: str, task_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/tasks/{task_id}")

    async def get_task_logs(self, telegram_user_id: str, task_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/tasks/{task_id}/logs")

    async def retry_task(self, telegram_user_id: str, task_id: str) -> dict:
        return await self._request("POST", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/tasks/{task_id}/retry")

    async def cancel_task(self, telegram_user_id: str, task_id: str) -> dict:
        return await self._request("POST", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/tasks/{task_id}/cancel")

    async def list_results(self, telegram_user_id: str, machine_id: str) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/machines/{machine_id}/results",
        )

    async def get_result(self, telegram_user_id: str, result_id: str) -> dict:
        return await self._request("GET", f"/api/v1/integrations/telegram/bot/users/{telegram_user_id}/results/{result_id}")

    async def list_pending_challenges(self) -> list[dict]:
        return await self._request("GET", "/api/v1/integrations/telegram/bot/challenges/pending")

    async def mark_challenge_notified(
        self,
        challenge_id: str,
        *,
        telegram_user_id: str,
        telegram_chat_id: str,
        message_id: int,
    ) -> None:
        await self._request(
            "POST",
            f"/api/v1/integrations/telegram/bot/challenges/{challenge_id}/notified",
            json={
                "telegram_user_id": telegram_user_id,
                "telegram_chat_id": telegram_chat_id,
                "message_id": message_id,
            },
        )

    async def approve_challenge(self, challenge_id: str, *, telegram_user_id: str, telegram_chat_id: str) -> dict:
        return await self._request(
            "POST",
            f"/api/v1/integrations/telegram/bot/challenges/{challenge_id}/approve",
            json={"telegram_user_id": telegram_user_id, "telegram_chat_id": telegram_chat_id},
        )

    async def reject_challenge(self, challenge_id: str, *, telegram_user_id: str, telegram_chat_id: str) -> dict:
        return await self._request(
            "POST",
            f"/api/v1/integrations/telegram/bot/challenges/{challenge_id}/reject",
            json={"telegram_user_id": telegram_user_id, "telegram_chat_id": telegram_chat_id},
        )
