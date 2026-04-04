from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.deps import (
    build_client_context,
    build_external_api_client_context,
    get_access_repository,
    get_command_repository,
    get_current_user,
    get_external_api_repository,
    get_machine_repository,
    get_reports_repository,
    get_repository,
    get_result_repository,
    get_task_repository,
    get_telegram_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.integrations.external_api.repository import ExternalApiRepository
from app.domains.integrations.external_api.schemas import ApiKeyCreateRequest, ApiKeyCreateResponse, ApiKeyDeleteRequest, ApiKeyRead
from app.domains.integrations.external_api.service import ExternalApiService
from app.domains.integrations.telegram.repository import TelegramRepository
from app.domains.integrations.telegram.schemas import TelegramLinkDeleteRequest, TelegramLinkStartResponse, TelegramLinkStatusRead
from app.domains.integrations.telegram.service import TelegramClientContext, TelegramIntegrationService
from app.domains.machines.repository import MachineRepository
from app.domains.reports.repository import ReportsRepository
from app.domains.results.repository import ResultRepository
from app.domains.tasks.repository import TaskRepository

router = APIRouter(prefix="/profile", tags=["profile"])


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


def _build_telegram_service(
    *,
    auth_repository: AuthRepository,
    telegram_repository: TelegramRepository,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
    command_repository: CommandRepository,
    task_repository: TaskRepository,
    result_repository: ResultRepository,
    reports_repository: ReportsRepository,
) -> TelegramIntegrationService:
    return TelegramIntegrationService(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )


@router.get("/api-keys", response_model=list[ApiKeyRead])
def list_api_keys(
    current_user=Depends(get_current_user),
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
    ).list_api_keys(actor_user_id=current_user.id)


@router.get("/telegram", response_model=TelegramLinkStatusRead)
def get_telegram_profile(
    current_user=Depends(get_current_user),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_telegram_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_profile(actor_user_id=current_user.id)


@router.post("/telegram/link", response_model=TelegramLinkStartResponse, status_code=status.HTTP_201_CREATED)
def start_telegram_link(
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_telegram_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).start_link(
        actor_user_id=current_user.id,
        client=TelegramClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
    )


@router.delete("/telegram", status_code=status.HTTP_204_NO_CONTENT)
def unlink_telegram(
    payload: TelegramLinkDeleteRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    _build_telegram_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).unlink(
        actor_user=current_user,
        reauth_token=payload.reauth_token,
        client=TelegramClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
    )


@router.get("/api-keys/{key_id}", response_model=ApiKeyRead)
def get_api_key(
    key_id: str,
    current_user=Depends(get_current_user),
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
    ).get_api_key(actor_user_id=current_user.id, key_id=key_id)


@router.post("/api-keys", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    payload: ApiKeyCreateRequest,
    current_user=Depends(get_current_user),
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
    return _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).create_api_key(actor_user=current_user, payload=payload, client=client)


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    payload: ApiKeyDeleteRequest,
    current_user=Depends(get_current_user),
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
    _build_service(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).revoke_api_key(actor_user=current_user, key_id=key_id, reauth_token=payload.reauth_token, client=client)
