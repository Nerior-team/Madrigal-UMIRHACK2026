from app.core.exceptions import AppError
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_view_machine
from app.domains.machines.repository import MachineRepository
from app.domains.reports.json_export import build_machine_history_export, build_result_export, build_task_export
from app.domains.reports.repository import ReportsRepository
from app.domains.reports.schemas import ReportExportRead, ResultSummaryRead, TaskSummaryRead
from app.domains.reports.summary import build_result_summary, build_task_summary


class ReportsService:
    def __init__(
        self,
        *,
        reports_repository: ReportsRepository,
        machine_repository: MachineRepository,
        access_repository: AccessRepository,
    ) -> None:
        self.reports_repository = reports_repository
        self.machine_repository = machine_repository
        self.access_repository = access_repository

    def _require_access(self, *, actor_user_id: str, machine_id: str):
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ensure_can_view_machine(access.role)
        return machine

    def get_result_summary(self, *, actor_user_id: str, result_id: str) -> ResultSummaryRead:
        row = self.reports_repository.get_result_history_row(result_id)
        if row is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        self._require_access(actor_user_id=actor_user_id, machine_id=row.task.machine_id)
        return build_result_summary(row)

    def get_task_summary(self, *, actor_user_id: str, task_id: str) -> TaskSummaryRead:
        row = self.reports_repository.get_task_report_row(task_id)
        if row is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_access(actor_user_id=actor_user_id, machine_id=row.task.machine_id)
        return build_task_summary(row)

    def export_result_json(self, *, actor_user_id: str, result_id: str) -> ReportExportRead:
        row = self.reports_repository.get_result_history_row(result_id)
        if row is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        machine = self._require_access(actor_user_id=actor_user_id, machine_id=row.task.machine_id)
        return build_result_export(row=row, machine=machine)

    def export_task_json(self, *, actor_user_id: str, task_id: str) -> ReportExportRead:
        row = self.reports_repository.get_task_report_row(task_id)
        if row is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        machine = self._require_access(actor_user_id=actor_user_id, machine_id=row.task.machine_id)
        return build_task_export(row=row, machine=machine)

    def export_machine_history_json(self, *, actor_user_id: str, machine_id: str) -> ReportExportRead:
        machine = self._require_access(actor_user_id=actor_user_id, machine_id=machine_id)
        rows = self.reports_repository.list_machine_result_history(machine_id)
        return build_machine_history_export(machine=machine, rows=rows)
