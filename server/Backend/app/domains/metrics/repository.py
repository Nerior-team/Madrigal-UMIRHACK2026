from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domains.metrics.models import MachineMetricSnapshot
from app.domains.results.models import CommandExecutionResult
from app.domains.tasks.models import Task, TaskAttempt
from app.shared.enums import TaskStatus


class MetricsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def build_machine_snapshot(self, machine_id: str) -> MachineMetricSnapshot:
        status_rows = self.db.execute(
            select(Task.status, func.count(Task.id))
            .where(Task.machine_id == machine_id)
            .group_by(Task.status)
        ).all()
        counts = {status: int(count) for status, count in status_rows}

        result_row = self.db.execute(
            select(func.avg(CommandExecutionResult.duration_ms), func.max(CommandExecutionResult.created_at))
            .join(Task, Task.id == CommandExecutionResult.task_id)
            .where(Task.machine_id == machine_id)
        ).first()
        avg_duration = int(result_row[0]) if result_row and result_row[0] is not None else None
        last_result_at = result_row[1] if result_row else None

        return MachineMetricSnapshot(
            machine_id=machine_id,
            total_tasks=sum(counts.values()),
            succeeded_tasks=counts.get(TaskStatus.SUCCEEDED, 0),
            failed_tasks=counts.get(TaskStatus.FAILED, 0),
            cancelled_tasks=counts.get(TaskStatus.CANCELLED, 0),
            avg_duration_ms=avg_duration,
            last_result_at=last_result_at,
        )
