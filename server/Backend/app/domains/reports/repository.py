from sqlalchemy.orm import Session

from app.domains.machines.models import Machine
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultHistoryRow, ResultRepository
from app.domains.tasks.repository import TaskReportRow, TaskRepository


class ReportsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.machine_repository = MachineRepository(db)
        self.result_repository = ResultRepository(db)
        self.task_repository = TaskRepository(db)

    def get_result_history_row(self, result_id: str) -> ResultHistoryRow | None:
        return self.result_repository.get_history_row(result_id)

    def list_machine_result_history(self, machine_id: str) -> list[ResultHistoryRow]:
        return self.result_repository.list_machine_history(machine_id=machine_id)

    def get_task_report_row(self, task_id: str) -> TaskReportRow | None:
        return self.task_repository.get_task_report_row(task_id)

    def get_machine(self, machine_id: str) -> Machine | None:
        return self.machine_repository.get_machine(machine_id)
