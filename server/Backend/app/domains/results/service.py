import json

from app.core.exceptions import AppError
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_view_machine
from app.domains.machines.repository import MachineRepository
from app.domains.results.diff import build_result_diff
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import (
    CommandExecutionResultRead,
    ResultDiffRead,
    ResultHistoryEntryRead,
    ShellResultRead,
)
from app.domains.results.snapshots import build_result_snapshot
from app.domains.tasks.repository import TaskRepository
from app.shared.enums import ResultParserKind


def _safe_json(value: str) -> dict | list | None:
    try:
        return json.loads(value)
    except Exception:
        return None


def parse_result_payload(
    *,
    parser_kind: ResultParserKind,
    stdout: str,
    stderr: str,
    exit_code: int,
) -> tuple[str | None, dict | None]:
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
    def __init__(
        self,
        result_repository: ResultRepository,
        task_repository: TaskRepository,
        machine_repository: MachineRepository | None = None,
        access_repository: AccessRepository | None = None,
    ) -> None:
        self.result_repository = result_repository
        self.task_repository = task_repository
        self.machine_repository = machine_repository
        self.access_repository = access_repository

    def _require_access(self, *, machine_id: str, actor_user_id: str) -> None:
        if self.machine_repository is None or self.access_repository is None:
            raise RuntimeError("ResultService requires machine and access repositories for actor-scoped reads")
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ensure_can_view_machine(access.role)

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

    def list_machine_history(
        self,
        *,
        actor_user_id: str,
        machine_id: str,
        template_key: str | None = None,
    ) -> list[ResultHistoryEntryRead]:
        self._require_access(machine_id=machine_id, actor_user_id=actor_user_id)
        return [
            ResultHistoryEntryRead(
                id=row.result.id,
                task_id=row.result.task_id,
                attempt_id=row.result.attempt_id,
                machine_id=row.task.machine_id,
                template_key=row.task.template_key,
                template_name=row.task.template_name,
                parser_kind=row.result.parser_kind,
                summary=row.result.summary,
                exit_code=row.result.exit_code,
                duration_ms=row.result.duration_ms,
                created_at=row.result.created_at,
            )
            for row in self.result_repository.list_machine_history(machine_id=machine_id, template_key=template_key)
        ]

    def list_machine_history_for_machine_ids(
        self,
        *,
        actor_user_id: str,
        machine_ids: list[str],
        template_key: str | None = None,
    ) -> list[ResultHistoryEntryRead]:
        if not machine_ids:
            return []
        for machine_id in machine_ids:
            self._require_access(machine_id=machine_id, actor_user_id=actor_user_id)
        return [
            ResultHistoryEntryRead(
                id=row.result.id,
                task_id=row.result.task_id,
                attempt_id=row.result.attempt_id,
                machine_id=row.task.machine_id,
                template_key=row.task.template_key,
                template_name=row.task.template_name,
                parser_kind=row.result.parser_kind,
                summary=row.result.summary,
                exit_code=row.result.exit_code,
                duration_ms=row.result.duration_ms,
                created_at=row.result.created_at,
            )
            for row in self.result_repository.list_machine_history_for_machines(
                machine_ids=machine_ids,
                template_key=template_key,
            )
        ]

    def diff_results(self, *, actor_user_id: str, left_result_id: str, right_result_id: str) -> ResultDiffRead:
        left_row = self.result_repository.get_history_row(left_result_id)
        right_row = self.result_repository.get_history_row(right_result_id)
        if left_row is None or right_row is None:
            raise AppError("task_result_not_found", "Один из результатов не найден.", 404)
        if left_row.task.machine_id != right_row.task.machine_id:
            raise AppError("result_diff_invalid", "Дифф доступен только внутри одной машины.", 400)
        self._require_access(machine_id=left_row.task.machine_id, actor_user_id=actor_user_id)
        return build_result_diff(
            left_result_id=left_row.result.id,
            right_result_id=right_row.result.id,
            left_snapshot=build_result_snapshot(result=left_row.result, task=left_row.task),
            right_snapshot=build_result_snapshot(result=right_row.result, task=right_row.task),
        )
