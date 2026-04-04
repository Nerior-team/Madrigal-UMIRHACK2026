from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def _status_icon(status: str) -> str:
    return {
        "online": "[+]",
        "offline": "[-]",
        "pending": "[~]",
        "queued": "[Q]",
        "dispatched": "[>]",
        "accepted": "[A]",
        "running": "[*]",
        "succeeded": "[OK]",
        "failed": "[ERR]",
        "cancelled": "[X]",
    }.get(status, "-")


def truncate(text: str | None, *, limit: int = 3500) -> str:
    if not text:
        return "-"
    text = text.strip()
    if len(text) <= limit:
        return text
    return f"{text[: limit - 3]}..."


def _format_heartbeat(value: str | None) -> str:
    if not value:
        return "-"
    try:
        normalized = value.replace("Z", "+00:00")
        timestamp = datetime.fromisoformat(normalized)
        return timestamp.astimezone(ZoneInfo("Europe/Moscow")).strftime("%d.%m.%Y %H:%M:%S MSK")
    except ValueError:
        return value


def main_menu_keyboard(*, linked: bool) -> InlineKeyboardMarkup:
    rows = []
    if linked:
        rows.extend(
            [
                [InlineKeyboardButton(text="Машины", callback_data="menu:machines"), InlineKeyboardButton(text="Задачи", callback_data="menu:tasks")],
                [InlineKeyboardButton(text="Результаты", callback_data="menu:results"), InlineKeyboardButton(text="Профиль", callback_data="menu:profile")],
            ]
        )
    else:
        rows.append([InlineKeyboardButton(text="Обновить", callback_data="menu:main")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def with_main_menu(rows: list[list[InlineKeyboardButton]]) -> InlineKeyboardMarkup:
    rows.append([InlineKeyboardButton(text="Главное меню", callback_data="menu:main")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def back_and_menu(back_callback: str) -> InlineKeyboardMarkup:
    return with_main_menu([[InlineKeyboardButton(text="Назад", callback_data=back_callback)]])


def machine_list_keyboard(items: list[dict], *, callback_prefix: str) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{_status_icon(item['status'])} {item['display_name']}", callback_data=f"{callback_prefix}:{item['id']}")]
        for item in items
    ]
    return with_main_menu(rows)


def machine_detail_keyboard(machine_id: str) -> InlineKeyboardMarkup:
    return with_main_menu(
        [
            [
                InlineKeyboardButton(text="Команды", callback_data=f"machine_commands:{machine_id}"),
                InlineKeyboardButton(text="Задачи", callback_data=f"machine_tasks:{machine_id}"),
            ],
            [InlineKeyboardButton(text="Результаты", callback_data=f"machine_results:{machine_id}")],
            [InlineKeyboardButton(text="Назад", callback_data="menu:machines")],
        ]
    )


def commands_keyboard(machine_id: str, items: list[dict]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=item["name"], callback_data=f"command:{machine_id}:{index}")]
        for index, item in enumerate(items)
    ]
    rows.append([InlineKeyboardButton(text="Назад", callback_data=f"machine:{machine_id}")])
    return with_main_menu(rows)


def confirm_run_keyboard(machine_id: str, template_key: str, *, back_callback: str) -> InlineKeyboardMarkup:
    return with_main_menu(
        [
            [InlineKeyboardButton(text="Запустить", callback_data=f"run:{machine_id}:{template_key}")],
            [InlineKeyboardButton(text="Назад", callback_data=back_callback)],
        ]
    )


def parameter_values_keyboard(state_id: str, param_index: int, allowed_values: list[str], *, back_callback: str) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=value, callback_data=f"runparam:{state_id}:{param_index}:{value_index}")]
        for value_index, value in enumerate(allowed_values)
    ]
    rows.append([InlineKeyboardButton(text="Назад", callback_data=back_callback)])
    return with_main_menu(rows)


def run_state_confirm_keyboard(state_id: str, *, back_callback: str) -> InlineKeyboardMarkup:
    return with_main_menu(
        [
            [InlineKeyboardButton(text="Запустить", callback_data=f"runconfirm:{state_id}")],
            [InlineKeyboardButton(text="Назад", callback_data=back_callback)],
        ]
    )


def task_list_keyboard(machine_id: str, items: list[dict]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{_status_icon(item['status'])} {item['template_name']}", callback_data=f"task:{item['id']}")]
        for item in items
    ]
    rows.append([InlineKeyboardButton(text="Назад", callback_data=f"machine:{machine_id}")])
    return with_main_menu(rows)


def task_detail_keyboard(task: dict) -> InlineKeyboardMarkup:
    machine_id = task["machine_id"]
    rows: list[list[InlineKeyboardButton]] = []
    status = task["status"]
    if status in {"queued", "dispatched", "accepted", "running"}:
        rows.append([InlineKeyboardButton(text="Отменить", callback_data=f"task_cancel:{task['id']}")])
    if status in {"failed", "cancelled"}:
        rows.append([InlineKeyboardButton(text="Повторить", callback_data=f"task_retry:{task['id']}")])
    rows.append([InlineKeyboardButton(text="Логи", callback_data=f"task_logs:{task['id']}")])
    rows.append([InlineKeyboardButton(text="Назад", callback_data=f"machine_tasks:{machine_id}")])
    return with_main_menu(rows)


def result_list_keyboard(machine_id: str, items: list[dict]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{_status_icon('succeeded' if item['exit_code'] == 0 else 'failed')} {item['template_name']}", callback_data=f"result:{item['id']}")]
        for item in items
    ]
    rows.append([InlineKeyboardButton(text="Назад", callback_data=f"machine:{machine_id}")])
    return with_main_menu(rows)


def result_detail_keyboard(machine_id: str, result_id: str) -> InlineKeyboardMarkup:
    return with_main_menu(
        [
            [InlineKeyboardButton(text="Shell", callback_data=f"result_shell:{result_id}")],
            [InlineKeyboardButton(text="Назад", callback_data=f"machine_results:{machine_id}")],
        ]
    )


def challenge_keyboard(challenge_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Подтвердить", callback_data=f"auth_approve:{challenge_id}"),
                InlineKeyboardButton(text="Отклонить", callback_data=f"auth_reject:{challenge_id}"),
            ],
            [InlineKeyboardButton(text="Главное меню", callback_data="menu:main")],
        ]
    )


def format_main_menu(text: str) -> str:
    return text


def format_machine_list(items: list[dict], *, title: str) -> str:
    if not items:
        return f"{title}\n\nМашин пока нет."
    lines = [title, ""]
    for item in items:
        lines.append(
            f"{_status_icon(item['status'])} {item['display_name']} - {item['hostname']} ({item['os_family']})"
        )
    return "\n".join(lines)


def format_machine_detail(machine: dict) -> str:
    return "\n".join(
        [
            f"{_status_icon(machine['status'])} {machine['display_name']}",
            "",
            f"Хост: {machine['hostname']}",
            f"ОС: {machine['os_family']} {machine['os_version'] or ''}".strip(),
            f"Статус: {machine['status']}",
        f"Heartbeat: {_format_heartbeat(machine['last_heartbeat_at'])}",
            f"Владелец: {machine['owner_email']}",
            f"Моя роль: {machine['my_role']}",
        ]
    )


def format_commands(machine: dict, items: list[dict]) -> str:
    if not items:
        return f"Команды для {machine['display_name']}\n\nДоступных шаблонов нет."
    lines = [f"Команды для {machine['display_name']}", ""]
    for item in items:
        suffix = "builtin" if item["is_builtin"] else "custom"
        lines.append(f"- {item['name']} [{suffix}]")
    return "\n".join(lines)


def format_command_confirm(machine: dict, template: dict, params: dict[str, str]) -> str:
    lines = [
        f"Запуск: {template['name']}",
        "",
        f"Машина: {machine['display_name']}",
        f"Runner: {template['runner']}",
    ]
    if params:
        lines.append("Параметры:")
        lines.extend(f"- {key}: {value}" for key, value in params.items())
    return "\n".join(lines)


def format_tasks(machine: dict, items: list[dict]) -> str:
    if not items:
        return f"Задачи по {machine['display_name']}\n\nИстория пока пустая."
    lines = [f"Задачи по {machine['display_name']}", ""]
    for item in items:
        lines.append(f"{_status_icon(item['status'])} {item['template_name']} ({item['status']})")
    return "\n".join(lines)


def format_task_detail(task: dict) -> str:
    latest_attempt = task["attempts"][-1] if task["attempts"] else None
    lines = [
        f"{_status_icon(task['status'])} {task['template_name']}",
        "",
        f"Статус: {task['status']}",
        f"Команда: {truncate(task['rendered_command'], limit=500)}",
    ]
    if latest_attempt is not None:
        if latest_attempt.get("progress_message"):
            lines.append(f"Прогресс: {latest_attempt['progress_message']}")
        if latest_attempt.get("error_message"):
            lines.append(f"Ошибка: {truncate(latest_attempt['error_message'], limit=500)}")
        if latest_attempt.get("result_id"):
            lines.append(f"Result ID: {latest_attempt['result_id']}")
    return "\n".join(lines)


def format_task_logs(task: dict, items: list[dict]) -> str:
    chunks = [item["chunk"] for item in items[-12:]]
    body = "\n".join(chunks) if chunks else "Логи пока пустые."
    return "\n".join([f"Логи: {task['template_name']}", "", truncate(body, limit=3500)])


def format_results(machine: dict, items: list[dict]) -> str:
    if not items:
        return f"Результаты по {machine['display_name']}\n\nИстория пока пустая."
    lines = [f"Результаты по {machine['display_name']}", ""]
    for item in items:
        icon = _status_icon("succeeded" if item["exit_code"] == 0 else "failed")
        lines.append(f"{icon} {item['template_name']} — {truncate(item['summary'], limit=140)}")
    return "\n".join(lines)


def format_result_detail(result: dict, summary: dict) -> str:
    lines = [
        f"{_status_icon(summary['status'])} Результат",
        "",
        f"Итог: {summary['summary']}",
        f"Exit code: {summary['exit_code']}",
        f"Длительность: {summary['duration_ms']} ms",
    ]
    highlights = summary.get("highlights") or []
    if highlights:
        lines.append("")
        lines.append("Ключевое:")
        lines.extend(f"- {item}" for item in highlights[:5])
    return "\n".join(lines)


def format_result_shell(result: dict) -> str:
    shell = result["shell"]
    parts = [
        "Shell",
        "",
        f"Команда:\n{truncate(shell['command'], limit=700)}",
        "",
        f"stdout:\n{truncate(shell['stdout'], limit=1200)}",
        "",
        f"stderr:\n{truncate(shell['stderr'], limit=900)}",
        "",
        f"exit_code: {shell['exit_code']}, duration: {shell['duration_ms']} ms",
    ]
    return "\n".join(parts)


def format_profile(profile: dict) -> str:
    return "\n".join(
        [
            "Профиль",
            "",
            f"Email: {profile['email']}",
            f"Telegram: {'привязан' if profile['linked'] else 'не привязан'}",
            f"Username: {profile.get('telegram_username') or '-'}",
            f"2FA через Telegram: {'включена' if profile['two_factor_enabled'] else 'выключена'}",
        ]
    )
