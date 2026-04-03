import re

from app.core.exceptions import AppError
from app.domains.commands.schemas import MachineCommandTemplateParameterRequest
from app.shared.enums import CommandRunner, OperatingSystemFamily

PLACEHOLDER_PATTERN = re.compile(r"{([a-zA-Z_][a-zA-Z0-9_]*)}")
FORBIDDEN_TOKENS = ("&&", "||", ";", "|", "\n", "\r")


def ensure_runner_allowed_for_machine(*, os_family: OperatingSystemFamily, runner: CommandRunner) -> None:
    if os_family in {OperatingSystemFamily.LINUX, OperatingSystemFamily.MACOS} and runner != CommandRunner.SHELL:
        raise AppError("command_runner_invalid", "Для этой машины доступен только shell runner.", 400)


def ensure_command_pattern_safe(command_pattern: str) -> None:
    for token in FORBIDDEN_TOKENS:
        if token in command_pattern:
            raise AppError("command_pattern_invalid", "Команда содержит недопустимые составные shell-операторы.", 400)


def validate_parameter_definitions(parameters: list[MachineCommandTemplateParameterRequest]) -> list[dict]:
    seen_keys: set[str] = set()
    normalized: list[dict] = []
    for item in parameters:
        if item.key in seen_keys:
            raise AppError("command_parameter_duplicate", "Параметры команды должны иметь уникальные ключи.", 400)
        seen_keys.add(item.key)
        allowed_values = [value.strip() for value in item.allowed_values if value.strip()]
        if not allowed_values:
            raise AppError("command_parameter_empty", "У параметра должен быть непустой allowlist.", 400)
        normalized.append(
            {
                "key": item.key,
                "label": item.label.strip(),
                "type": item.type.value,
                "allowed_values": allowed_values,
            }
        )
    return normalized


def ensure_placeholders_match(command_pattern: str, parameters: list[dict]) -> None:
    placeholders = set(PLACEHOLDER_PATTERN.findall(command_pattern))
    parameter_keys = {item["key"] for item in parameters}
    if placeholders != parameter_keys:
        raise AppError(
            "command_placeholders_invalid",
            "Плейсхолдеры команды должны точно совпадать с объявленными параметрами.",
            400,
        )


def normalize_param_values(parameters: list[dict], params: dict[str, str] | None) -> dict[str, str]:
    params = params or {}
    normalized: dict[str, str] = {}
    parameter_map = {item["key"]: item for item in parameters}

    if set(params.keys()) != set(parameter_map.keys()):
        raise AppError("command_params_invalid", "Переданы не все обязательные параметры команды.", 400)

    for key, definition in parameter_map.items():
        value = str(params[key]).strip()
        if value not in definition["allowed_values"]:
            raise AppError("command_param_value_invalid", f"Недопустимое значение параметра: {key}.", 400)
        normalized[key] = value
    return normalized


def render_command(command_pattern: str, params: dict[str, str]) -> str:
    command = command_pattern
    for key, value in params.items():
        command = command.replace(f"{{{key}}}", value)
    if PLACEHOLDER_PATTERN.search(command):
        raise AppError("command_render_incomplete", "Не удалось полностью собрать команду.", 500)
    return command
