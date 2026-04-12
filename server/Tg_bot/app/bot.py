from __future__ import annotations

import asyncio
import logging

from aiogram import F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, Message

from app.backend import BackendClient
from app.state import BotStateStore
from app.ui import (
    back_and_menu,
    challenge_keyboard,
    commands_keyboard,
    format_command_confirm,
    format_commands,
    format_machine_detail,
    format_machine_list,
    format_profile,
    format_result_detail,
    format_result_shell,
    format_results,
    format_task_detail,
    format_task_logs,
    format_tasks,
    machine_detail_keyboard,
    machine_list_keyboard,
    main_menu_keyboard,
    parameter_values_keyboard,
    result_detail_keyboard,
    result_list_keyboard,
    run_state_confirm_keyboard,
    task_detail_keyboard,
    task_list_keyboard,
)


logger = logging.getLogger(__name__)


def build_router(client: BackendClient, state_store: BotStateStore) -> Router:
    router = Router()

    def _telegram_ids(event: Message | CallbackQuery) -> tuple[str, str]:
        user = event.from_user if isinstance(event, Message) else event.from_user
        chat = event.chat if isinstance(event, Message) else event.message.chat
        return str(user.id), str(chat.id)

    def _start_payload(message: Message) -> str | None:
        parts = (message.text or "").split(maxsplit=1)
        if len(parts) < 2:
            return None
        return parts[1].strip()

    async def _render(target: Message | CallbackQuery, text: str, markup: InlineKeyboardMarkup) -> None:
        if isinstance(target, CallbackQuery):
            try:
                await target.message.edit_text(text=text, reply_markup=markup)
            except TelegramBadRequest:
                await target.message.answer(text=text, reply_markup=markup)
            await target.answer()
            return
        await target.answer(text=text, reply_markup=markup)

    async def _render_main_menu(target: Message | CallbackQuery, *, headline: str | None = None) -> None:
        telegram_user_id, _ = _telegram_ids(target)
        linked = True
        try:
            profile = await client.get_profile(telegram_user_id)
            text = headline or "Главное меню"
            text = f"{text}\n\nАккаунт: {profile['email']}"
        except RuntimeError:
            linked = False
            text = headline or "Главное меню"
            text = f"{text}\n\nTelegram пока не привязан. Запусти привязку из веба или desktop."
        await _render(target, text, main_menu_keyboard(linked=linked))

    async def _load_machine(telegram_user_id: str, machine_id: str) -> dict:
        payload = await client.get_machine(telegram_user_id, machine_id)
        return payload["machine"]

    async def _load_template(telegram_user_id: str, machine_id: str, template_key: str) -> dict:
        payload = await client.list_commands(telegram_user_id, machine_id)
        for item in payload["items"]:
            if item["template_key"] == template_key:
                return item
        raise RuntimeError("Шаблон команды не найден.")

    async def _render_parameter_step(target: CallbackQuery, state_id: str, param_index: int) -> None:
        run_state = await state_store.get_run_state(state_id)
        if run_state is None:
            await _render(target, "Сессия выбора команды устарела. Начни заново.", back_and_menu("menu:machines"))
            return
        parameter = run_state["parameters"][param_index]
        selected = run_state.get("selected", {})
        text = "\n".join(
            [
                f"Параметр: {parameter['label']}",
                "",
                f"Команда: {run_state['template_name']}",
                f"Уже выбрано: {', '.join(f'{key}={value}' for key, value in selected.items()) or 'ничего'}",
            ]
        )
        back_callback = (
            f"machine_commands:{run_state['machine_id']}"
            if param_index == 0
            else f"runback:{state_id}:{param_index - 1}"
        )
        await _render(
            target,
            text,
            parameter_values_keyboard(
                state_id,
                param_index,
                parameter["allowed_values"],
                back_callback=back_callback,
            ),
        )

    async def _render_run_confirm(target: CallbackQuery, state_id: str) -> None:
        run_state = await state_store.get_run_state(state_id)
        if run_state is None:
            await _render(target, "Сессия выбора команды устарела. Начни заново.", back_and_menu("menu:machines"))
            return
        machine = await _load_machine(run_state["telegram_user_id"], run_state["machine_id"])
        await _render(
            target,
            format_command_confirm(machine, run_state, run_state.get("selected", {})),
            run_state_confirm_keyboard(state_id, back_callback=f"machine_commands:{run_state['machine_id']}"),
        )

    @router.message(CommandStart())
    async def handle_start(message: Message) -> None:
        telegram_user_id, telegram_chat_id = _telegram_ids(message)
        payload = await client.start(
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
            telegram_username=message.from_user.username,
            telegram_first_name=message.from_user.first_name,
            deep_link_payload=_start_payload(message),
        )
        await _render(
            message,
            payload["text"],
            main_menu_keyboard(linked=payload["linked"]),
        )

    @router.callback_query(F.data == "menu:main")
    async def show_main_menu(callback: CallbackQuery) -> None:
        await _render_main_menu(callback)

    @router.callback_query(F.data == "menu:machines")
    async def show_machines(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        payload = await client.list_machines(telegram_user_id)
        await _render(
            callback,
            format_machine_list(payload["items"], title="Машины"),
            machine_list_keyboard(payload["items"], callback_prefix="machine"),
        )

    @router.callback_query(F.data == "menu:tasks")
    async def show_task_machine_picker(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        payload = await client.list_machines(telegram_user_id)
        await _render(
            callback,
            format_machine_list(payload["items"], title="Выбери машину для просмотра задач"),
            machine_list_keyboard(payload["items"], callback_prefix="machine_tasks"),
        )

    @router.callback_query(F.data == "menu:results")
    async def show_result_machine_picker(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        payload = await client.list_machines(telegram_user_id)
        await _render(
            callback,
            format_machine_list(payload["items"], title="Выбери машину для просмотра результатов"),
            machine_list_keyboard(payload["items"], callback_prefix="machine_results"),
        )

    @router.callback_query(F.data == "menu:profile")
    async def show_profile(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        profile = await client.get_profile(telegram_user_id)
        await _render(callback, format_profile(profile), back_and_menu("menu:main"))

    @router.callback_query(F.data.startswith("machine:"))
    async def show_machine_detail(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        machine_id = callback.data.split(":", 1)[1]
        machine = await _load_machine(telegram_user_id, machine_id)
        await _render(callback, format_machine_detail(machine), machine_detail_keyboard(machine_id))

    @router.callback_query(F.data.startswith("machine_commands:"))
    async def show_machine_commands(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        machine_id = callback.data.split(":", 1)[1]
        machine = await _load_machine(telegram_user_id, machine_id)
        payload = await client.list_commands(telegram_user_id, machine_id)
        await _render(callback, format_commands(machine, payload["items"]), commands_keyboard(machine_id, payload["items"]))

    @router.callback_query(F.data.startswith("command:"))
    async def show_command(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        _, machine_id, template_index_raw = callback.data.split(":", 2)
        template_index = int(template_index_raw)
        machine = await _load_machine(telegram_user_id, machine_id)
        payload = await client.list_commands(telegram_user_id, machine_id)
        items = payload["items"]
        if template_index < 0 or template_index >= len(items):
            await _render(callback, "Команда больше недоступна. Открой список заново.", back_and_menu(f"machine_commands:{machine_id}"))
            return
        template = items[template_index]
        state_id = await state_store.create_run_state(
            {
                "telegram_user_id": telegram_user_id,
                "machine_id": machine_id,
                "template_key": template["template_key"],
                "template_name": template["name"],
                "runner": template["runner"],
                "parameters": template["parameters"],
                "selected": {},
            }
        )
        if not template["parameters"]:
            await _render(
                callback,
                format_command_confirm(machine, template, {}),
                run_state_confirm_keyboard(state_id, back_callback=f"machine_commands:{machine_id}"),
            )
            return
        await _render_parameter_step(callback, state_id, 0)

    @router.callback_query(F.data.startswith("run:"))
    async def run_simple_command(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        _, machine_id, template_key = callback.data.split(":", 2)
        task = await client.create_task(telegram_user_id, machine_id=machine_id, template_key=template_key, params={})
        await _render(callback, format_task_detail(task["task"]), task_detail_keyboard(task["task"]))

    @router.callback_query(F.data.startswith("runparam:"))
    async def choose_command_param(callback: CallbackQuery) -> None:
        _, state_id, param_index_raw, value_index_raw = callback.data.split(":", 3)
        run_state = await state_store.get_run_state(state_id)
        if run_state is None:
            await _render(callback, "Сессия выбора команды устарела. Начни заново.", back_and_menu("menu:machines"))
            return
        param_index = int(param_index_raw)
        value_index = int(value_index_raw)
        parameter = run_state["parameters"][param_index]
        run_state.setdefault("selected", {})[parameter["key"]] = parameter["allowed_values"][value_index]
        await state_store.save_run_state(state_id, run_state)
        next_index = param_index + 1
        if next_index >= len(run_state["parameters"]):
            await _render_run_confirm(callback, state_id)
            return
        await _render_parameter_step(callback, state_id, next_index)

    @router.callback_query(F.data.startswith("runback:"))
    async def go_back_param(callback: CallbackQuery) -> None:
        _, state_id, previous_index_raw = callback.data.split(":", 2)
        await _render_parameter_step(callback, state_id, int(previous_index_raw))

    @router.callback_query(F.data.startswith("runconfirm:"))
    async def run_stateful_command(callback: CallbackQuery) -> None:
        _, state_id = callback.data.split(":", 1)
        run_state = await state_store.get_run_state(state_id)
        if run_state is None:
            await _render(callback, "Сессия выбора команды устарела. Начни заново.", back_and_menu("menu:machines"))
            return
        task = await client.create_task(
            run_state["telegram_user_id"],
            machine_id=run_state["machine_id"],
            template_key=run_state["template_key"],
            params=run_state.get("selected", {}),
        )
        await state_store.delete_run_state(state_id)
        await _render(callback, format_task_detail(task["task"]), task_detail_keyboard(task["task"]))

    @router.callback_query(F.data.startswith("machine_tasks:"))
    async def show_machine_tasks(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        machine_id = callback.data.split(":", 1)[1]
        machine = await _load_machine(telegram_user_id, machine_id)
        payload = await client.list_tasks(telegram_user_id, machine_id)
        await _render(callback, format_tasks(machine, payload["items"]), task_list_keyboard(machine_id, payload["items"]))

    @router.callback_query(F.data.startswith("task:"))
    async def show_task(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        task_id = callback.data.split(":", 1)[1]
        payload = await client.get_task(telegram_user_id, task_id)
        await _render(callback, format_task_detail(payload["task"]), task_detail_keyboard(payload["task"]))

    @router.callback_query(F.data.startswith("task_logs:"))
    async def show_task_logs(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        task_id = callback.data.split(":", 1)[1]
        task = await client.get_task(telegram_user_id, task_id)
        logs = await client.get_task_logs(telegram_user_id, task_id)
        await _render(callback, format_task_logs(task["task"], logs["items"]), back_and_menu(f"task:{task_id}"))

    @router.callback_query(F.data.startswith("task_retry:"))
    async def retry_task(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        task_id = callback.data.split(":", 1)[1]
        payload = await client.retry_task(telegram_user_id, task_id)
        await _render(callback, format_task_detail(payload["task"]), task_detail_keyboard(payload["task"]))

    @router.callback_query(F.data.startswith("task_cancel:"))
    async def cancel_task(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        task_id = callback.data.split(":", 1)[1]
        response = await client.cancel_task(telegram_user_id, task_id)
        task = await client.get_task(telegram_user_id, task_id)
        await _render(
            callback,
            f"{response['message']}\n\n{format_task_detail(task['task'])}",
            task_detail_keyboard(task["task"]),
        )

    @router.callback_query(F.data.startswith("machine_results:"))
    async def show_machine_results(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        machine_id = callback.data.split(":", 1)[1]
        machine = await _load_machine(telegram_user_id, machine_id)
        payload = await client.list_results(telegram_user_id, machine_id)
        await _render(callback, format_results(machine, payload["items"]), result_list_keyboard(machine_id, payload["items"]))

    @router.callback_query(F.data.startswith("result:"))
    async def show_result(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        result_id = callback.data.split(":", 1)[1]
        payload = await client.get_result(telegram_user_id, result_id)
        await _render(
            callback,
            format_result_detail(payload["result"], payload["summary"]),
            result_detail_keyboard(payload["summary"]["machine_id"], result_id),
        )

    @router.callback_query(F.data.startswith("result_shell:"))
    async def show_result_shell(callback: CallbackQuery) -> None:
        telegram_user_id, _ = _telegram_ids(callback)
        result_id = callback.data.split(":", 1)[1]
        payload = await client.get_result(telegram_user_id, result_id)
        await _render(
            callback,
            format_result_shell(payload["result"]),
            back_and_menu(f"result:{result_id}"),
        )

    @router.callback_query(F.data.startswith("auth_approve:"))
    async def approve_auth(callback: CallbackQuery) -> None:
        telegram_user_id, telegram_chat_id = _telegram_ids(callback)
        challenge_id = callback.data.split(":", 1)[1]
        response = await client.approve_challenge(
            challenge_id,
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
        )
        await _render(callback, response["message"], main_menu_keyboard(linked=True))

    @router.callback_query(F.data.startswith("auth_reject:"))
    async def reject_auth(callback: CallbackQuery) -> None:
        telegram_user_id, telegram_chat_id = _telegram_ids(callback)
        challenge_id = callback.data.split(":", 1)[1]
        response = await client.reject_challenge(
            challenge_id,
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
        )
        await _render(callback, response["message"], main_menu_keyboard(linked=True))

    return router


async def auth_prompt_worker(bot, client: BackendClient, poll_interval: int) -> None:
    while True:
        try:
            prompts = await client.list_pending_challenges()
            for prompt in prompts:
                sent = await bot.send_message(
                    chat_id=int(prompt["telegram_chat_id"]),
                    text=prompt["prompt_text"],
                    reply_markup=challenge_keyboard(prompt["challenge_id"]),
                )
                await client.mark_challenge_notified(
                    prompt["challenge_id"],
                    telegram_user_id=prompt["telegram_user_id"],
                    telegram_chat_id=prompt["telegram_chat_id"],
                    message_id=sent.message_id,
                )
        except Exception as exc:
            logger.warning("Telegram auth prompt poll failed: %s", exc)
        await asyncio.sleep(poll_interval)


async def notification_worker(bot, client: BackendClient, poll_interval: int) -> None:
    while True:
        try:
            notifications = await client.list_pending_notifications()
            for item in notifications:
                try:
                    sent = await bot.send_message(
                        chat_id=int(item["telegram_chat_id"]),
                        text=item["text"],
                    )
                    await client.mark_notification_delivered(
                        item["notification_id"],
                        telegram_user_id=item["telegram_user_id"],
                        telegram_chat_id=item["telegram_chat_id"],
                        message_id=sent.message_id,
                    )
                except Exception as exc:
                    await client.mark_notification_failed(
                        item["notification_id"],
                        telegram_user_id=item["telegram_user_id"],
                        telegram_chat_id=item["telegram_chat_id"],
                        error=str(exc),
                    )
        except Exception as exc:
            logger.warning("Telegram notification poll failed: %s", exc)
        await asyncio.sleep(poll_interval)
