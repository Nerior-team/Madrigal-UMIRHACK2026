from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher

from app.backend import BackendClient
from app.bot import auth_prompt_worker, build_router
from app.config import get_settings
from app.state import BotStateStore


logging.basicConfig(level=logging.INFO)


async def run() -> None:
    settings = get_settings()
    bot = Bot(token=settings.telegram_bot_token)
    dispatcher = Dispatcher()
    backend_client = BackendClient(
        base_url=settings.backend_base_url,
        signing_secret=settings.effective_telegram_internal_signing_secret,
    )
    state_store = BotStateStore.build(
        host=settings.redis_host,
        port=settings.redis_port,
        ttl_seconds=settings.bot_state_ttl_seconds,
    )
    dispatcher.include_router(build_router(backend_client, state_store))
    prompt_task = asyncio.create_task(
        auth_prompt_worker(
            bot,
            backend_client,
            poll_interval=settings.bot_auth_poll_interval_seconds,
        )
    )
    try:
        await dispatcher.start_polling(bot)
    finally:
        prompt_task.cancel()
        await backend_client.close()
        await state_store.close()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(run())
