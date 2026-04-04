from dataclasses import dataclass

from app.core.exceptions import AppError
from app.core.security import hash_token
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_run_tasks, ensure_can_view_machine
from app.domains.commands.repository import CommandRepository
from app.domains.commands.service import CommandService
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import CommandExecutionResultRead, ShellResultRead
from app.domains.results.service import ResultService, parse_result_payload
from app.domains.tasks.models import Task
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.schemas import (
    AgentClaimTaskResponse,
    TaskActionResponse,
    TaskAttemptRead,
    TaskCreateRequest,
    TaskFailureRequest,
    TaskLogEntryRead,
    TaskLogRequest,
    TaskProgressRequest,
    TaskRead,
    TaskResultRequest,
)
from app.infra.observability.audit import record_audit_event
from app.realtime.broker import operator_feed
from app.realtime.events import operator_event
from app.shared.enums import AuditStatus, ResultParserKind, TaskFailureKind, TaskStatus
from app.shared.time import utc_now


@dataclass(slots=True)
class TaskCancelOutcome:
    response: TaskActionResponse
    should_notify_machine: bool


class TaskService:
    def __init__(
        self,
        *,
        access_repository: AccessRepository,
        machine_repository: MachineRepository,
        command_repository: CommandRepository | None = None,
        task_repository: TaskRepository | None = None,
        result_repository: ResultRepository | None = None,
    ) -> None:
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.command_repository = command_repository or CommandRepository(machine_repository.db)
        self.task_repository = task_repository or TaskRepository(machine_repository.db)
        self.result_repository = result_repository or ResultRepository(machine_repository.db)
        self.command_service = CommandService(
            access_repository=access_repository,
            machine_repository=machine_repository,
            command_repository=self.command_repository,
        )
        self.result_service = ResultService(
            self.result_repository,
            self.task_repository,
            machine_repository,
            access_repository,
        )

    def _publish_operator_event(self, *, event_type: str, machine_id: str, payload: dict, task_id: str | None = None) -> None:
        operator_feed.publish(
            operator_event(
                event_type=event_type,
                machine_id=machine_id,
                task_id=task_id,
                payload=payload,
            )
        )

    def _require_machine_access(self, *, machine_id: str, actor_user_id: str):
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ownership = self.access_repository.get_ownership(machine_id)
        return machine, access, ownership

    def _authenticate_machine(self, machine_token: str):
        machine = self.machine_repository.get_machine_by_token_hash(hash_token(machine_token, purpose="machine_access"))
        if machine is None:
            raise AppError("machine_unauthorized", "Требуется machine token.", 401)
        return machine

    def _build_attempt_read(self, attempt) -> TaskAttemptRead:
        result = self.result_repository.get_result_by_attempt(attempt.id)
        return TaskAttemptRead(
            id=attempt.id,
            attempt_no=attempt.attempt_no,
            status=attempt.status,
            failure_kind=attempt.failure_kind,
            error_message=attempt.error_message,
            progress_message=attempt.progress_message,
            progress_percent=attempt.progress_percent,
            queued_at=attempt.queued_at,
            dispatched_at=attempt.dispatched_at,
            accepted_at=attempt.accepted_at,
            started_at=attempt.started_at,
            finished_at=attempt.finished_at,
            cancel_requested_at=attempt.cancel_requested_at,
            result_id=result.id if result is not None else None,
        )

    def _build_task_read(self, task: Task) -> TaskRead:
        attempts = [self._build_attempt_read(item) for item in self.task_repository.get_attempts_for_task(task.id)]
        return TaskRead(
            id=task.id,
            machine_id=task.machine_id,
            template_key=task.template_key,
            template_name=task.template_name,
            runner=task.runner,
            status=task.status,
            requested_by_user_id=task.requested_by_user_id,
            params=task.params_payload or {},
            rendered_command=task.rendered_command,
            parser_kind=task.parser_kind,
            created_at=task.created_at,
            updated_at=task.updated_at,
            attempts=attempts,
        )

    def should_notify_machine(self, *, machine_id: str) -> bool:
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            return False
        active = self.task_repository.count_active_attempts(machine_id)
        queued = self.task_repository.get_next_queued_attempt(machine_id)
        return active < machine.concurrency_limit and queued is not None

    def create_task(self, *, actor_user, payload: TaskCreateRequest, client) -> TaskRead:
        machine, access, _ = self._require_machine_access(machine_id=payload.machine_id, actor_user_id=actor_user.id)
        ensure_can_run_tasks(access.role)

        rendered = self.command_service.resolve_template_for_machine(
            machine_id=payload.machine_id,
            template_key=payload.template_key,
            params=payload.params,
        )
        task = self.task_repository.create_task(
            machine_id=machine.id,
            requested_by_user_id=actor_user.id,
            template_key=rendered.template_key,
            template_name=rendered.template_name,
            task_kind=rendered.task_kind,
            runner=rendered.runner,
            params_payload=rendered.params,
            rendered_command=rendered.command,
            parser_kind=rendered.parser_kind.value,
        )
        attempt = self.task_repository.create_attempt(task_id=task.id, machine_id=machine.id, attempt_no=1)
        self.task_repository.create_event(task_id=task.id, attempt_id=attempt.id, status=TaskStatus.QUEUED, message="Task queued")
        record_audit_event(
            self.task_repository,
            user_id=actor_user.id,
            action="tasks.created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"task_id": task.id, "machine_id": machine.id, "template_key": rendered.template_key},
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_created",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "template_key": task.template_key,
                "template_name": task.template_name,
                "status": TaskStatus.QUEUED.value,
            },
        )
        return self._build_task_read(task)

    def list_tasks(self, *, actor_user_id: str, machine_id: str) -> list[TaskRead]:
        _, access, _ = self._require_machine_access(machine_id=machine_id, actor_user_id=actor_user_id)
        ensure_can_view_machine(access.role)
        rows = self.task_repository.list_tasks_for_machine(machine_id)
        unique_tasks: dict[str, Task] = {}
        for row in rows:
            unique_tasks[row.task.id] = row.task
        return [self._build_task_read(task) for task in unique_tasks.values()]

    def get_task(self, *, actor_user_id: str, task_id: str) -> TaskRead:
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        _, access, _ = self._require_machine_access(machine_id=task.machine_id, actor_user_id=actor_user_id)
        ensure_can_view_machine(access.role)
        return self._build_task_read(task)

    def claim_next_task(self, *, machine_token: str) -> AgentClaimTaskResponse | None:
        machine = self._authenticate_machine(machine_token)
        if self.task_repository.count_active_attempts(machine.id) >= machine.concurrency_limit:
            return None

        attempt = self.task_repository.get_next_queued_attempt(machine.id)
        if attempt is None:
            return None

        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        attempt.status = TaskStatus.DISPATCHED
        attempt.dispatched_at = utc_now()
        task.status = TaskStatus.DISPATCHED
        self.task_repository.save(attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=attempt.id,
            status=TaskStatus.DISPATCHED,
            message="Task dispatched to daemon",
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_updated",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.DISPATCHED.value,
            },
        )

        return AgentClaimTaskResponse(
            task_id=task.id,
            attempt_id=attempt.id,
            template_key=task.template_key,
            template_name=task.template_name,
            runner=task.runner,
            parser_kind=task.parser_kind,
            command=task.rendered_command,
            params=task.params_payload or {},
        )

    def mark_attempt_accepted(self, *, attempt_id: str, machine_token: str) -> TaskActionResponse:
        machine = self._authenticate_machine(machine_token)
        attempt = self.task_repository.get_attempt(attempt_id)
        if attempt is None or attempt.machine_id != machine.id:
            raise AppError("task_attempt_not_found", "Попытка выполнения не найдена.", 404)
        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        attempt.status = TaskStatus.ACCEPTED
        attempt.accepted_at = utc_now()
        attempt.started_at = utc_now()
        task.status = TaskStatus.ACCEPTED
        self.task_repository.save(attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(task_id=task.id, attempt_id=attempt.id, status=TaskStatus.ACCEPTED, message="Task accepted")
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_updated",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.ACCEPTED.value,
            },
        )
        return TaskActionResponse(message="Task accepted")

    def update_progress(self, *, attempt_id: str, machine_token: str, payload: TaskProgressRequest) -> TaskActionResponse:
        machine = self._authenticate_machine(machine_token)
        attempt = self.task_repository.get_attempt(attempt_id)
        if attempt is None or attempt.machine_id != machine.id:
            raise AppError("task_attempt_not_found", "Попытка выполнения не найдена.", 404)
        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        attempt.status = TaskStatus.RUNNING
        attempt.progress_message = payload.message
        attempt.progress_percent = payload.percent
        task.status = TaskStatus.RUNNING
        self.task_repository.save(attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=attempt.id,
            status=TaskStatus.RUNNING,
            message=payload.message,
            payload={"percent": payload.percent},
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_updated",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.RUNNING.value,
                "progress_message": payload.message,
                "progress_percent": payload.percent,
            },
        )
        return TaskActionResponse(message="Progress updated")

    def append_log(self, *, attempt_id: str, machine_token: str, payload: TaskLogRequest) -> TaskActionResponse:
        machine = self._authenticate_machine(machine_token)
        attempt = self.task_repository.get_attempt(attempt_id)
        if attempt is None or attempt.machine_id != machine.id:
            raise AppError("task_attempt_not_found", "Попытка выполнения не найдена.", 404)
        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        log_chunk = self.task_repository.create_log_chunk(
            task_id=task.id,
            attempt_id=attempt.id,
            stream=payload.stream,
            sequence=payload.sequence,
            chunk=payload.chunk,
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_log_appended",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "stream": payload.stream.value,
                "sequence": payload.sequence,
                "message": payload.chunk,
                "created_at": log_chunk.created_at.isoformat(),
            },
        )
        return TaskActionResponse(message="Log chunk saved")

    def complete_attempt(self, *, attempt_id: str, machine_token: str, payload: TaskResultRequest) -> CommandExecutionResultRead:
        machine = self._authenticate_machine(machine_token)
        attempt = self.task_repository.get_attempt(attempt_id)
        if attempt is None or attempt.machine_id != machine.id:
            raise AppError("task_attempt_not_found", "Попытка выполнения не найдена.", 404)
        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        parser_kind = ResultParserKind(task.parser_kind)
        summary, parsed_payload = parse_result_payload(
            parser_kind=parser_kind,
            stdout=payload.stdout,
            stderr=payload.stderr,
            exit_code=payload.exit_code,
        )
        result = self.result_repository.create_result(
            task_id=task.id,
            attempt_id=attempt.id,
            parser_kind=parser_kind,
            summary=summary,
            parsed_payload=parsed_payload,
            shell_command=task.rendered_command,
            stdout=payload.stdout,
            stderr=payload.stderr,
            exit_code=payload.exit_code,
            duration_ms=payload.duration_ms,
        )
        attempt.status = TaskStatus.SUCCEEDED
        attempt.finished_at = utc_now()
        task.status = TaskStatus.SUCCEEDED
        self.task_repository.save(attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=attempt.id,
            status=TaskStatus.SUCCEEDED,
            message="Task completed",
            payload={"result_id": result.id},
        )
        self.result_repository.commit()
        self._publish_operator_event(
            event_type="task_finished",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.SUCCEEDED.value,
                "result_id": result.id,
                "duration_ms": payload.duration_ms,
                "exit_code": payload.exit_code,
            },
        )
        self._publish_operator_event(
            event_type="result_created",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "result_id": result.id,
                "task_id": task.id,
                "summary": summary,
                "parser_kind": parser_kind.value,
            },
        )
        return self.result_service.get_result(result.id)

    def fail_attempt(self, *, attempt_id: str, machine_token: str, payload: TaskFailureRequest) -> TaskActionResponse:
        machine = self._authenticate_machine(machine_token)
        attempt = self.task_repository.get_attempt(attempt_id)
        if attempt is None or attempt.machine_id != machine.id:
            raise AppError("task_attempt_not_found", "Попытка выполнения не найдена.", 404)
        task = self.task_repository.get_task(attempt.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)

        parser_kind = ResultParserKind(task.parser_kind)
        summary, parsed_payload = parse_result_payload(
            parser_kind=parser_kind,
            stdout=payload.stdout,
            stderr=payload.stderr,
            exit_code=1,
        )
        result = self.result_repository.create_result(
            task_id=task.id,
            attempt_id=attempt.id,
            parser_kind=parser_kind,
            summary=summary,
            parsed_payload=parsed_payload,
            shell_command=task.rendered_command,
            stdout=payload.stdout,
            stderr=payload.stderr,
            exit_code=1,
            duration_ms=payload.duration_ms,
        )
        attempt.status = TaskStatus.FAILED
        attempt.failure_kind = payload.error_kind
        attempt.error_message = payload.error_message
        attempt.finished_at = utc_now()
        task.status = TaskStatus.FAILED
        self.task_repository.save(attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=attempt.id,
            status=TaskStatus.FAILED,
            message=payload.error_message,
            payload={"error_kind": payload.error_kind.value},
        )
        self.result_repository.commit()
        self._publish_operator_event(
            event_type="task_finished",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.FAILED.value,
                "result_id": result.id,
                "duration_ms": payload.duration_ms,
                "exit_code": 1,
                "error_kind": payload.error_kind.value,
                "error_message": payload.error_message,
            },
        )
        self._publish_operator_event(
            event_type="result_created",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "result_id": result.id,
                "task_id": task.id,
                "summary": summary,
                "parser_kind": parser_kind.value,
            },
        )
        return TaskActionResponse(message="Task failed")

    def retry_task(self, *, actor_user, task_id: str, client) -> TaskRead:
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        _, access, _ = self._require_machine_access(machine_id=task.machine_id, actor_user_id=actor_user.id)
        ensure_can_run_tasks(access.role)
        latest_attempt = self.task_repository.get_attempts_for_task(task_id)[-1]
        if latest_attempt.status not in {TaskStatus.FAILED, TaskStatus.CANCELLED}:
            raise AppError("task_retry_invalid", "Повторный запуск доступен только для failed/cancelled задач.", 400)

        task.latest_attempt_no += 1
        task.status = TaskStatus.QUEUED
        self.task_repository.save(task)
        attempt = self.task_repository.create_attempt(task_id=task.id, machine_id=task.machine_id, attempt_no=task.latest_attempt_no)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=attempt.id,
            status=TaskStatus.QUEUED,
            message="Task retry queued",
        )
        record_audit_event(
            self.task_repository,
            user_id=actor_user.id,
            action="tasks.retried",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"task_id": task.id, "attempt_no": attempt.attempt_no},
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_updated",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": attempt.id,
                "status": TaskStatus.QUEUED.value,
                "attempt_no": attempt.attempt_no,
            },
        )
        return self._build_task_read(task)

    def cancel_task(self, *, actor_user, task_id: str, client) -> TaskCancelOutcome:
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        _, access, _ = self._require_machine_access(machine_id=task.machine_id, actor_user_id=actor_user.id)
        ensure_can_run_tasks(access.role)
        latest_attempt = self.task_repository.get_attempts_for_task(task_id)[-1]
        notify_machine = False
        if latest_attempt.status == TaskStatus.QUEUED:
            latest_attempt.status = TaskStatus.CANCELLED
            latest_attempt.failure_kind = TaskFailureKind.CANCELLED
            latest_attempt.error_message = "Task cancelled before execution"
            latest_attempt.finished_at = utc_now()
            task.status = TaskStatus.CANCELLED
        elif latest_attempt.status in {TaskStatus.DISPATCHED, TaskStatus.ACCEPTED, TaskStatus.RUNNING}:
            latest_attempt.cancel_requested_at = utc_now()
            notify_machine = True
        else:
            raise AppError("task_cancel_invalid", "Задачу в этом статусе нельзя отменить.", 400)

        self.task_repository.save(latest_attempt)
        self.task_repository.save(task)
        self.task_repository.create_event(
            task_id=task.id,
            attempt_id=latest_attempt.id,
            status=TaskStatus.CANCELLED if not notify_machine else latest_attempt.status,
            message="Task cancel requested" if notify_machine else "Task cancelled",
        )
        record_audit_event(
            self.task_repository,
            user_id=actor_user.id,
            action="tasks.cancelled" if not notify_machine else "tasks.cancel_requested",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"task_id": task.id, "attempt_id": latest_attempt.id},
        )
        self.task_repository.commit()
        self._publish_operator_event(
            event_type="task_finished" if not notify_machine else "task_updated",
            machine_id=task.machine_id,
            task_id=task.id,
            payload={
                "task_id": task.id,
                "attempt_id": latest_attempt.id,
                "status": (TaskStatus.CANCELLED if not notify_machine else latest_attempt.status).value,
                "message": "Task cancel requested" if notify_machine else "Task cancelled",
            },
        )
        return TaskCancelOutcome(
            response=TaskActionResponse(message="Task cancellation scheduled" if notify_machine else "Task cancelled"),
            should_notify_machine=notify_machine,
        )

    def get_result(self, *, actor_user_id: str, result_id: str) -> CommandExecutionResultRead:
        result = self.result_repository.get_result(result_id)
        if result is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        task = self.task_repository.get_task(result.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        _, access, _ = self._require_machine_access(machine_id=task.machine_id, actor_user_id=actor_user_id)
        ensure_can_view_machine(access.role)
        return self.result_service.get_result(result_id)

    def get_task_logs(self, *, actor_user_id: str, task_id: str) -> list[TaskLogEntryRead]:
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°.", 404)
        _, access, _ = self._require_machine_access(machine_id=task.machine_id, actor_user_id=actor_user_id)
        ensure_can_view_machine(access.role)
        return [
            TaskLogEntryRead(
                id=item.id,
                attempt_id=item.attempt_id,
                stream=item.stream,
                sequence=item.sequence,
                chunk=item.chunk,
                created_at=item.created_at,
            )
            for item in self.task_repository.get_log_chunks_for_task(task_id)
        ]
