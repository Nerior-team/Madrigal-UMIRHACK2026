import json

from app.core.exceptions import AppError
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import CommandExecutionResultRead, ShellResultRead
from app.shared.enums import ResultParserKind


def _safe_json(value: str) -> dict | list | None:
    try:
        return json.loads(value)
    except Exception:
        return None


def parse_result_payload(*, parser_kind: ResultParserKind, stdout: str, stderr: str, exit_code: int) -> tuple[str | None, dict | None]:
    if parser_kind == ResultParserKind.NONE:
        summary = "Команда завершилась успешно." if exit_code == 0 else "Команда завершилась с ошибкой."
        return summary, {"exit_code": exit_code}

    if parser_kind == ResultParserKind.DISK_USAGE:
        lines = [line.strip() for line in stdout.splitlines() if line.strip()]
        return "Собраны данные по дискам.", {"lines": lines[:20], "exit_code": exit_code}

    if parser_kind == ResultParserKind.NETWORK_CONTEXT:
        payload = _safe_json(stdout)
        return "Собран сетевой контекст машины.", {"raw": payload or stdout[:4000], "exit_code": exit_code}

    if parser_kind == ResultParserKind.MEMORY_USAGE:
        payload = _safe_json(stdout)
        return "Собраны данные по памяти.", {"raw": payload or stdout[:4000], "exit_code": exit_code}

    if parser_kind == ResultParserKind.BASIC_DIAGNOSTICS:
        payload = _safe_json(stdout)
        return "Собрана базовая диагностика узла.", {"raw": payload or stdout[:4000], "exit_code": exit_code}

    return stderr[:4000] or stdout[:4000] or None, {"exit_code": exit_code}


class ResultService:
    def __init__(self, result_repository: ResultRepository) -> None:
        self.result_repository = result_repository

    def get_result(self, result_id: str) -> CommandExecutionResultRead:
        result = self.result_repository.get_result(result_id)
        if result is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        return CommandExecutionResultRead(
            id=result.id,
            task_id=result.task_id,
            attempt_id=result.attempt_id,
            parser_kind=result.parser_kind,
            summary=result.summary,
            parsed_payload=result.parsed_payload,
            shell=ShellResultRead(
                command=result.shell_command,
                stdout=result.stdout,
                stderr=result.stderr,
                exit_code=result.exit_code,
                duration_ms=result.duration_ms,
            ),
            created_at=result.created_at,
        )
