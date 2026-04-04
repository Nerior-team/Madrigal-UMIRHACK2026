from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domains.auth.models import AuditEvent
from app.domains.results.models import CommandExecutionResult
from app.domains.tasks.models import Task, TaskAttempt, TaskEvent, TaskLogChunk
from app.shared.enums import TaskStatus


@dataclass(slots=True)
class TaskListRow:
    task: Task
    attempt: TaskAttempt
    result: CommandExecutionResult | None


@dataclass(slots=True)
class TaskReportRow:
    task: Task
    attempts: list[TaskAttempt]
    result: CommandExecutionResult | None
    logs: list[TaskLogChunk]


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def add_audit_event(
        self,
        *,
        user_id: str | None,
        action: str,
        status,
        ip_address: str | None,
        user_agent: str | None,
        details: dict | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            user_id=user_id,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.db.add(event)
        self.db.flush()
        return event

    def create_task(
        self,
        *,
        machine_id: str,
        requested_by_user_id: str,
        template_key: str,
        template_name: str,
        task_kind,
        runner,
        params_payload: dict,
        rendered_command: str,
        parser_kind: str,
    ) -> Task:
        task = Task(
            machine_id=machine_id,
            requested_by_user_id=requested_by_user_id,
            template_key=template_key,
            template_name=template_name,
            task_kind=task_kind,
            runner=runner,
            params_payload=params_payload,
            rendered_command=rendered_command,
            parser_kind=parser_kind,
        )
        self.db.add(task)
        self.db.flush()
        return task

    def create_attempt(self, *, task_id: str, machine_id: str, attempt_no: int) -> TaskAttempt:
        attempt = TaskAttempt(
            task_id=task_id,
            machine_id=machine_id,
            attempt_no=attempt_no,
        )
        self.db.add(attempt)
        self.db.flush()
        return attempt

    def create_event(
        self,
        *,
        task_id: str,
        attempt_id: str,
        status,
        message: str | None = None,
        payload: dict | None = None,
    ) -> TaskEvent:
        event = TaskEvent(task_id=task_id, attempt_id=attempt_id, status=status, message=message, payload=payload)
        self.db.add(event)
        self.db.flush()
        return event

    def create_log_chunk(
        self,
        *,
        task_id: str,
        attempt_id: str,
        stream,
        sequence: int,
        chunk: str,
    ) -> TaskLogChunk:
        item = TaskLogChunk(
            task_id=task_id,
            attempt_id=attempt_id,
            stream=stream,
            sequence=sequence,
            chunk=chunk,
        )
        self.db.add(item)
        self.db.flush()
        return item

    def get_task(self, task_id: str) -> Task | None:
        return self.db.get(Task, task_id)

    def get_attempt(self, attempt_id: str) -> TaskAttempt | None:
        return self.db.get(TaskAttempt, attempt_id)

    def get_attempts_for_task(self, task_id: str) -> list[TaskAttempt]:
        statement = select(TaskAttempt).where(TaskAttempt.task_id == task_id).order_by(TaskAttempt.attempt_no.asc())
        return list(self.db.scalars(statement).all())

    def get_result_for_attempt(self, attempt_id: str) -> CommandExecutionResult | None:
        statement = select(CommandExecutionResult).where(CommandExecutionResult.attempt_id == attempt_id)
        return self.db.scalar(statement)

    def get_log_chunks_for_task(self, task_id: str) -> list[TaskLogChunk]:
        statement = (
            select(TaskLogChunk)
            .where(TaskLogChunk.task_id == task_id)
            .order_by(TaskLogChunk.created_at.asc(), TaskLogChunk.sequence.asc())
        )
        return list(self.db.scalars(statement).all())

    def count_active_attempts(self, machine_id: str) -> int:
        statement = select(func.count(TaskAttempt.id)).where(
            TaskAttempt.machine_id == machine_id,
            TaskAttempt.status.in_([TaskStatus.DISPATCHED, TaskStatus.ACCEPTED, TaskStatus.RUNNING]),
        )
        return int(self.db.scalar(statement) or 0)

    def get_next_queued_attempt(self, machine_id: str) -> TaskAttempt | None:
        statement = (
            select(TaskAttempt)
            .where(TaskAttempt.machine_id == machine_id, TaskAttempt.status == TaskStatus.QUEUED)
            .order_by(TaskAttempt.queued_at.asc(), TaskAttempt.created_at.asc())
        )
        return self.db.scalar(statement)

    def list_tasks_for_machine(self, machine_id: str) -> list[TaskListRow]:
        statement = (
            select(Task, TaskAttempt, CommandExecutionResult)
            .join(TaskAttempt, TaskAttempt.task_id == Task.id)
            .outerjoin(CommandExecutionResult, CommandExecutionResult.attempt_id == TaskAttempt.id)
            .where(Task.machine_id == machine_id)
            .order_by(Task.created_at.desc(), TaskAttempt.attempt_no.asc())
        )
        return [TaskListRow(task=task, attempt=attempt, result=result) for task, attempt, result in self.db.execute(statement).all()]

    def list_tasks_for_machines(self, machine_ids: list[str]) -> list[TaskListRow]:
        if not machine_ids:
            return []
        statement = (
            select(Task, TaskAttempt, CommandExecutionResult)
            .join(TaskAttempt, TaskAttempt.task_id == Task.id)
            .outerjoin(CommandExecutionResult, CommandExecutionResult.attempt_id == TaskAttempt.id)
            .where(Task.machine_id.in_(machine_ids))
            .order_by(Task.created_at.desc(), TaskAttempt.attempt_no.asc())
        )
        return [TaskListRow(task=task, attempt=attempt, result=result) for task, attempt, result in self.db.execute(statement).all()]

    def get_task_report_row(self, task_id: str) -> TaskReportRow | None:
        task = self.get_task(task_id)
        if task is None:
            return None
        attempts = self.get_attempts_for_task(task_id)
        result = None
        if attempts:
            result = self.get_result_for_attempt(attempts[-1].id)
        logs = self.get_log_chunks_for_task(task_id)
        return TaskReportRow(task=task, attempts=attempts, result=result, logs=logs)
