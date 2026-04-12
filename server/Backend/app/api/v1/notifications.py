from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_notification_repository, get_telegram_repository
from app.domains.integrations.telegram.repository import TelegramRepository
from app.domains.notifications.repository import NotificationRepository
from app.domains.notifications.schemas import (
    NotificationListResponse,
    NotificationPreferencesRead,
    NotificationPreferencesUpdateRequest,
    TelegramNotificationDeliveryRequest,
    TelegramNotificationFailureRequest,
)
from app.domains.notifications.service import NotificationService

router = APIRouter(tags=["notifications"])


def _build_service(
    *,
    notification_repository: NotificationRepository,
    telegram_repository: TelegramRepository,
) -> NotificationService:
    return NotificationService(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    )


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user=Depends(get_current_user),
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    return _build_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).list_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    notification_id: str,
    current_user=Depends(get_current_user),
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    _build_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).mark_read(user_id=current_user.id, notification_id=notification_id)


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    current_user=Depends(get_current_user),
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    _build_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).mark_all_read(user_id=current_user.id)


@router.get("/notifications/preferences", response_model=NotificationPreferencesRead)
def get_notification_preferences(
    current_user=Depends(get_current_user),
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    return _build_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).get_preferences(user_id=current_user.id)


@router.put("/notifications/preferences", response_model=NotificationPreferencesRead)
def update_notification_preferences(
    payload: NotificationPreferencesUpdateRequest,
    current_user=Depends(get_current_user),
    notification_repository: Annotated[NotificationRepository, Depends(get_notification_repository)] = None,
    telegram_repository: Annotated[TelegramRepository, Depends(get_telegram_repository)] = None,
):
    return _build_service(
        notification_repository=notification_repository,
        telegram_repository=telegram_repository,
    ).update_preferences(user_id=current_user.id, payload=payload)
