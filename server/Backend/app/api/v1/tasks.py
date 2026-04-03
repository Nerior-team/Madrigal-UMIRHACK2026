from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.api.deps import (
    build_client_context,
    get_access_repository,
    get_command_repository,
    get_current_user,
    get_machine_repository,
    get_result_repository,
    get_task_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.agent_protocol.registration import parse_machine_bearer_token
from app.domains.commands.repository import CommandRepository
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import CommandExecutionResultRead
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.schemas import (
    AgentClaimTaskResponse,
    TaskActionResponse,
    TaskCreateRequest,
    TaskFailureRequest,
    TaskLogEntryRead,
    TaskLogRequest,
    TaskProgressRequest,
    TaskRead,
    TaskResultRequest,
)
from app.domains.tasks.service import TaskService
from app.realtime.task_stream import notify_task_available, notify_task_cancel

router = APIRouter(tags=["tasks"])


def _build_service(
    *,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
    command_repository: CommandRepository,
    task_repository: TaskRepository,
    result_repository: ResultRepository,
) -> TaskService:
    return TaskService(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )


@router.post("/tasks", response_model=TaskRead)
async def create_task(
    payload: TaskCreateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    service = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )
    task = service.create_task(actor_user=current_user, payload=payload, client=client)
    if service.should_notify_machine(machine_id=task.machine_id):
        await notify_task_available(machine_id=task.machine_id)
    return task


@router.get("/machines/{machine_id}/tasks", response_model=list[TaskRead])
def list_tasks(
    machine_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).list_tasks(actor_user_id=current_user.id, machine_id=machine_id)


@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(
    task_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).get_task(actor_user_id=current_user.id, task_id=task_id)


@router.get("/tasks/{task_id}/logs", response_model=list[TaskLogEntryRead])
def get_task_logs(
    task_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).get_task_logs(actor_user_id=current_user.id, task_id=task_id)


@router.post("/tasks/{task_id}/retry", response_model=TaskRead)
async def retry_task(
    task_id: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    service = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )
    task = service.retry_task(actor_user=current_user, task_id=task_id, client=client)
    if service.should_notify_machine(machine_id=task.machine_id):
        await notify_task_available(machine_id=task.machine_id)
    return task


@router.post("/tasks/{task_id}/cancel", response_model=TaskActionResponse)
async def cancel_task(
    task_id: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    service = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )
    outcome = service.cancel_task(actor_user=current_user, task_id=task_id, client=client)
    if outcome.should_notify_machine:
        task = service.get_task(actor_user_id=current_user.id, task_id=task_id)
        latest_attempt = task.attempts[-1]
        await notify_task_cancel(machine_id=task.machine_id, task_id=task.id, attempt_id=latest_attempt.id)
    return outcome.response


@router.post("/agent/tasks/claim", response_model=AgentClaimTaskResponse | None)
def claim_task(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).claim_next_task(machine_token=machine_token)


@router.post("/agent/tasks/{attempt_id}/accepted", response_model=TaskActionResponse)
def mark_task_accepted(
    attempt_id: str,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).mark_attempt_accepted(attempt_id=attempt_id, machine_token=machine_token)


@router.post("/agent/tasks/{attempt_id}/progress", response_model=TaskActionResponse)
def update_task_progress(
    attempt_id: str,
    payload: TaskProgressRequest,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).update_progress(attempt_id=attempt_id, machine_token=machine_token, payload=payload)


@router.post("/agent/tasks/{attempt_id}/logs", response_model=TaskActionResponse)
def append_task_log(
    attempt_id: str,
    payload: TaskLogRequest,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).append_log(attempt_id=attempt_id, machine_token=machine_token, payload=payload)


@router.post("/agent/tasks/{attempt_id}/result", response_model=CommandExecutionResultRead)
async def complete_task_attempt(
    attempt_id: str,
    payload: TaskResultRequest,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    service = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )
    result = service.complete_attempt(attempt_id=attempt_id, machine_token=machine_token, payload=payload)
    task = task_repository.get_task(result.task_id)
    if task is not None and service.should_notify_machine(machine_id=task.machine_id):
        await notify_task_available(machine_id=task.machine_id)
    return result


@router.post("/agent/tasks/{attempt_id}/failed", response_model=TaskActionResponse)
async def fail_task_attempt(
    attempt_id: str,
    payload: TaskFailureRequest,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    service = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    )
    response = service.fail_attempt(attempt_id=attempt_id, machine_token=machine_token, payload=payload)
    attempt = task_repository.get_attempt(attempt_id)
    if attempt is not None and service.should_notify_machine(machine_id=attempt.machine_id):
        await notify_task_available(machine_id=attempt.machine_id)
    return response
