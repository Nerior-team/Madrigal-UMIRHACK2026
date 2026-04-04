from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    build_external_api_client_context,
    get_access_repository,
    get_command_repository,
    get_external_api_principal,
    get_external_api_repository,
    get_machine_repository,
    get_reports_repository,
    get_repository,
    get_result_repository,
    get_task_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.integrations.external_api.repository import ExternalApiRepository
from app.domains.integrations.external_api.schemas import (
    ExternalMachineCommandsResponse,
    ExternalMachineListResponse,
    ExternalResultExportResponse,
    ExternalResultReadResponse,
    ExternalResultSummaryResponse,
    ExternalTaskCreateRequest,
    ExternalTaskLogsResponse,
    ExternalTaskReadResponse,
)
from app.domains.integrations.external_api.service import ExternalApiService
from app.domains.machines.repository import MachineRepository
from app.domains.machines.schemas import MachineDetail
from app.domains.reports.repository import ReportsRepository
from app.domains.results.repository import ResultRepository
from app.domains.tasks.repository import TaskRepository
from app.realtime.task_stream import notify_task_available

router = APIRouter(prefix="/external", tags=["external"])


def _build_service(
    *,
    auth_repository: AuthRepository,
    external_api_repository: ExternalApiRepository,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
    command_repository: CommandRepository,
    task_repository: TaskRepository,
    result_repository: ResultRepository,
    reports_repository: ReportsRepository,
) -> ExternalApiService:
    return ExternalApiService(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )


@router.get("/machines", response_model=ExternalMachineListResponse)
def list_machines(
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalMachineListResponse(machines=service.list_machines(principal=principal))


@router.get("/machines/{machine_id}", response_model=MachineDetail)
def get_machine(
    machine_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_machine(principal=principal, machine_id=machine_id)


@router.get("/machines/{machine_id}/commands", response_model=ExternalMachineCommandsResponse)
def list_machine_commands(
    machine_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalMachineCommandsResponse(commands=service.list_machine_commands(principal=principal, machine_id=machine_id))


@router.post("/tasks", response_model=ExternalTaskReadResponse)
async def create_task(
    payload: ExternalTaskCreateRequest,
    principal=Depends(get_external_api_principal),
    client=Depends(build_external_api_client_context),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    task = service.create_task(principal=principal, payload=payload, client=client)
    if service.should_notify_machine(machine_id=task.machine_id):
        await notify_task_available(machine_id=task.machine_id)
    return ExternalTaskReadResponse(task=task)


@router.get("/tasks/{task_id}", response_model=ExternalTaskReadResponse)
def get_task(
    task_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalTaskReadResponse(task=service.get_task(principal=principal, task_id=task_id))


@router.get("/tasks/{task_id}/logs", response_model=ExternalTaskLogsResponse)
def get_task_logs(
    task_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalTaskLogsResponse(logs=service.get_task_logs(principal=principal, task_id=task_id))


@router.get("/results/{result_id}", response_model=ExternalResultReadResponse)
def get_result(
    result_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalResultReadResponse(result=service.get_result(principal=principal, result_id=result_id))


@router.get("/results/{result_id}/summary", response_model=ExternalResultSummaryResponse)
def get_result_summary(
    result_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalResultSummaryResponse(summary=service.get_result_summary(principal=principal, result_id=result_id))


@router.get("/results/{result_id}/export/json", response_model=ExternalResultExportResponse)
def export_result_json(
    result_id: str,
    principal=Depends(get_external_api_principal),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    return ExternalResultExportResponse(export=service.export_result_json(principal=principal, result_id=result_id))
