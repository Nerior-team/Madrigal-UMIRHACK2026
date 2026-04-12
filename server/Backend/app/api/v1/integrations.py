from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    get_access_repository,
    get_command_repository,
    get_machine_repository,
    get_notification_repository,
    get_reports_repository,
    get_repository,
    get_result_repository,
    get_task_repository,
    get_telegram_repository,
    require_telegram_internal_signature,
)
from app.domains.access.repository import AccessRepository
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.integrations.telegram.repository import TelegramRepository
from app.domains.integrations.telegram.schemas import (
    TelegramBotAuthPromptRead,
    TelegramBotCommandsResponse,
    TelegramBotDecisionRequest,
    TelegramBotDecisionResponse,
    TelegramBotMachineDetailResponse,
    TelegramBotMachinesResponse,
    TelegramBotProfileRead,
    TelegramBotPromptNotificationRequest,
    TelegramBotResultDetailResponse,
    TelegramBotResultsResponse,
    TelegramBotStartRequest,
    TelegramBotStartResponse,
    TelegramBotTaskCreateRequest,
    TelegramBotTaskDetailResponse,
    TelegramBotTaskLogsResponse,
    TelegramBotTasksResponse,
)
from app.domains.notifications.repository import NotificationRepository
from app.domains.notifications.schemas import TelegramNotificationDeliveryRequest, TelegramNotificationDispatchRead, TelegramNotificationFailureRequest
from app.domains.notifications.service import NotificationService
from app.domains.integrations.telegram.service import TelegramClientContext, TelegramIntegrationService
from app.domains.machines.repository import MachineRepository
from app.domains.reports.repository import ReportsRepository
from app.domains.results.repository import ResultRepository
from app.domains.tasks.repository import TaskRepository
from app.realtime.task_stream import notify_task_available, notify_task_cancel

router = APIRouter(prefix="/integrations/telegram", tags=["integrations"])


def _build_service(
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


def _build_notification_service(
    *,
    notification_repository: NotificationRepository,
    telegram_repository: TelegramRepository,
) -> NotificationService:
    return NotificationService(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    )


@router.post("/bot/start", response_model=TelegramBotStartResponse, dependencies=[Depends(require_telegram_internal_signature)])
def bot_start(
    payload: TelegramBotStartRequest,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).handle_bot_start(
        payload=payload,
        client=TelegramClientContext(ip_address=None, user_agent="tg_bot"),
    )


@router.get(
    "/bot/notifications/pending",
    response_model=list[TelegramNotificationDispatchRead],
    dependencies=[Depends(require_telegram_internal_signature)],
)
def list_pending_bot_notifications(
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    return _build_notification_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).list_pending_telegram_notifications()


@router.post(
    "/bot/notifications/{notification_id}/delivered",
    status_code=204,
    dependencies=[Depends(require_telegram_internal_signature)],
)
def mark_bot_notification_delivered(
    notification_id: str,
    payload: TelegramNotificationDeliveryRequest,
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    _build_notification_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).mark_telegram_delivered(
        notification_id=notification_id,
        telegram_user_id=payload.telegram_user_id,
        telegram_chat_id=payload.telegram_chat_id,
    )


@router.post(
    "/bot/notifications/{notification_id}/failed",
    status_code=204,
    dependencies=[Depends(require_telegram_internal_signature)],
)
def mark_bot_notification_failed(
    notification_id: str,
    payload: TelegramNotificationFailureRequest,
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    _build_notification_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).mark_telegram_failed(
        notification_id=notification_id,
        telegram_user_id=payload.telegram_user_id,
        telegram_chat_id=payload.telegram_chat_id,
        error=payload.error,
    )


@router.get("/bot/users/{telegram_user_id}/profile", response_model=TelegramBotProfileRead, dependencies=[Depends(require_telegram_internal_signature)])
def get_bot_profile(
    telegram_user_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_bot_profile(telegram_user_id=telegram_user_id)


@router.get("/bot/users/{telegram_user_id}/machines", response_model=TelegramBotMachinesResponse, dependencies=[Depends(require_telegram_internal_signature)])
def list_bot_machines(
    telegram_user_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).list_bot_machines(telegram_user_id=telegram_user_id)


@router.get("/bot/users/{telegram_user_id}/machines/{machine_id}", response_model=TelegramBotMachineDetailResponse, dependencies=[Depends(require_telegram_internal_signature)])
def get_bot_machine(
    telegram_user_id: str,
    machine_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_bot_machine(telegram_user_id=telegram_user_id, machine_id=machine_id)


@router.get("/bot/users/{telegram_user_id}/machines/{machine_id}/commands", response_model=TelegramBotCommandsResponse, dependencies=[Depends(require_telegram_internal_signature)])
def list_bot_commands(
    telegram_user_id: str,
    machine_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).list_bot_commands(telegram_user_id=telegram_user_id, machine_id=machine_id)


@router.get("/bot/users/{telegram_user_id}/machines/{machine_id}/tasks", response_model=TelegramBotTasksResponse, dependencies=[Depends(require_telegram_internal_signature)])
def list_bot_tasks(
    telegram_user_id: str,
    machine_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).list_bot_tasks(telegram_user_id=telegram_user_id, machine_id=machine_id)


@router.post("/bot/users/{telegram_user_id}/tasks", response_model=TelegramBotTaskDetailResponse, dependencies=[Depends(require_telegram_internal_signature)])
async def create_bot_task(
    telegram_user_id: str,
    payload: TelegramBotTaskCreateRequest,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    task = service.create_bot_task(
        telegram_user_id=telegram_user_id,
        payload=payload,
        client=TelegramClientContext(ip_address=None, user_agent="tg_bot"),
    )
    if service.should_notify_machine(machine_id=task.task.machine_id):
        await notify_task_available(machine_id=task.task.machine_id)
    return task


@router.get("/bot/users/{telegram_user_id}/tasks/{task_id}", response_model=TelegramBotTaskDetailResponse, dependencies=[Depends(require_telegram_internal_signature)])
def get_bot_task(
    telegram_user_id: str,
    task_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_bot_task(telegram_user_id=telegram_user_id, task_id=task_id)


@router.get("/bot/users/{telegram_user_id}/tasks/{task_id}/logs", response_model=TelegramBotTaskLogsResponse, dependencies=[Depends(require_telegram_internal_signature)])
def get_bot_task_logs(
    telegram_user_id: str,
    task_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_bot_task_logs(telegram_user_id=telegram_user_id, task_id=task_id)


@router.post("/bot/users/{telegram_user_id}/tasks/{task_id}/retry", response_model=TelegramBotTaskDetailResponse, dependencies=[Depends(require_telegram_internal_signature)])
async def retry_bot_task(
    telegram_user_id: str,
    task_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    task = service.retry_bot_task(
        telegram_user_id=telegram_user_id,
        task_id=task_id,
        client=TelegramClientContext(ip_address=None, user_agent="tg_bot"),
    )
    if service.should_notify_machine(machine_id=task.task.machine_id):
        await notify_task_available(machine_id=task.task.machine_id)
    return task


@router.post("/bot/users/{telegram_user_id}/tasks/{task_id}/cancel", response_model=TelegramBotDecisionResponse, dependencies=[Depends(require_telegram_internal_signature)])
async def cancel_bot_task(
    telegram_user_id: str,
    task_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    service = _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    )
    response = service.cancel_bot_task(
        telegram_user_id=telegram_user_id,
        task_id=task_id,
        client=TelegramClientContext(ip_address=None, user_agent="tg_bot"),
    )
    task = task_repository.get_task(task_id)
    if task is not None:
        task_read = service.get_bot_task(telegram_user_id=telegram_user_id, task_id=task_id).task
        if task_read.attempts and task_read.attempts[-1].cancel_requested_at is not None:
            latest_attempt = task_read.attempts[-1]
            await notify_task_cancel(machine_id=task.machine_id, task_id=task.id, attempt_id=latest_attempt.id)
    return response


@router.get("/bot/users/{telegram_user_id}/machines/{machine_id}/results", response_model=TelegramBotResultsResponse, dependencies=[Depends(require_telegram_internal_signature)])
def list_bot_results(
    telegram_user_id: str,
    machine_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).list_bot_results(telegram_user_id=telegram_user_id, machine_id=machine_id)


@router.get("/bot/users/{telegram_user_id}/results/{result_id}", response_model=TelegramBotResultDetailResponse, dependencies=[Depends(require_telegram_internal_signature)])
def get_bot_result(
    telegram_user_id: str,
    result_id: str,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).get_bot_result(telegram_user_id=telegram_user_id, result_id=result_id)


@router.get("/bot/challenges/pending", response_model=list[TelegramBotAuthPromptRead], dependencies=[Depends(require_telegram_internal_signature)])
def list_pending_challenges(
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).list_pending_auth_prompts()


@router.post("/bot/challenges/{challenge_id}/notified", response_model=TelegramBotDecisionResponse, dependencies=[Depends(require_telegram_internal_signature)])
def mark_challenge_notified(
    challenge_id: str,
    payload: TelegramBotPromptNotificationRequest,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).mark_auth_prompt_notified(
        challenge_id=challenge_id,
        telegram_user_id=payload.telegram_user_id,
        telegram_chat_id=payload.telegram_chat_id,
        message_id=payload.message_id,
    )
    return TelegramBotDecisionResponse(message="ok")


@router.post("/bot/challenges/{challenge_id}/approve", response_model=TelegramBotDecisionResponse, dependencies=[Depends(require_telegram_internal_signature)])
def approve_challenge(
    challenge_id: str,
    payload: TelegramBotDecisionRequest,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).approve_auth_prompt(
        challenge_id=challenge_id,
        telegram_user_id=payload.telegram_user_id,
        telegram_chat_id=payload.telegram_chat_id,
    )


@router.post("/bot/challenges/{challenge_id}/reject", response_model=TelegramBotDecisionResponse, dependencies=[Depends(require_telegram_internal_signature)])
def reject_challenge(
    challenge_id: str,
    payload: TelegramBotDecisionRequest,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    return _build_service(
        auth_repository=auth_repository,
        telegram_repository=telegram_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).reject_auth_prompt(
        challenge_id=challenge_id,
        telegram_user_id=payload.telegram_user_id,
        telegram_chat_id=payload.telegram_chat_id,
    )
