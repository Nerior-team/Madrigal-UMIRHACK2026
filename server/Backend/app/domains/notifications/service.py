from dataclasses import dataclass

from app.core.exceptions import AppError
from app.domains.notifications.repository import NotificationRepository
from app.domains.notifications.schemas import (
    NotificationListResponse,
    NotificationPreferenceRead,
    NotificationPreferencesRead,
    NotificationPreferencesUpdateRequest,
    TelegramNotificationDispatchRead,
    UserNotificationRead,
)
from app.shared.enums import NotificationStatus, NotificationTopic
from app.shared.time import utc_now


@dataclass(slots=True)
class NotificationPublishRequest:
    user_id: str
    topic: object
    level: object
    title: str
    message: str
    action_url: str | None = None
    machine_id: str | None = None
    task_id: str | None = None
    result_id: str | None = None


class NotificationService:
    def __init__(self, *, notification_repository: NotificationRepository, telegram_repository) -> None:
        self.notification_repository = notification_repository
        self.telegram_repository = telegram_repository

    def _preference_items(self, user_id: str) -> list[NotificationPreferenceRead]:
        items: list[NotificationPreferenceRead] = []
        for topic in NotificationTopic:
            preference = self.notification_repository.get_or_create_preference(user_id=user_id, topic=topic)
            items.append(
                NotificationPreferenceRead(
                    topic=preference.topic,
                    site_enabled=preference.site_enabled,
                    telegram_enabled=preference.telegram_enabled,
                )
            )
        return items

    def get_preferences(self, *, user_id: str) -> NotificationPreferencesRead:
        return NotificationPreferencesRead(items=self._preference_items(user_id))

    def update_preferences(self, *, user_id: str, payload: NotificationPreferencesUpdateRequest) -> NotificationPreferencesRead:
        by_topic = {item.topic: item for item in payload.items}
        for topic in NotificationTopic:
            preference = self.notification_repository.get_or_create_preference(user_id=user_id, topic=topic)
            incoming = by_topic.get(topic)
            if incoming is None:
                continue
            preference.site_enabled = incoming.site_enabled
            preference.telegram_enabled = incoming.telegram_enabled
            self.notification_repository.save(preference)
        self.notification_repository.commit()
        return self.get_preferences(user_id=user_id)

    def _build_notification_read(self, item) -> UserNotificationRead:
        return UserNotificationRead(
            id=item.id,
            topic=item.topic,
            level=item.level,
            title=item.title,
            message=item.message,
            action_url=item.action_url,
            machine_id=item.machine_id,
            task_id=item.task_id,
            result_id=item.result_id,
            site_read=item.site_read_at is not None,
            telegram_enabled=item.telegram_enabled,
            telegram_status=item.telegram_status,
            created_at=item.created_at,
        )

    def list_notifications(self, *, user_id: str, unread_only: bool = False, limit: int = 25, offset: int = 0) -> NotificationListResponse:
        items = self.notification_repository.list_notifications(
            user_id=user_id,
            unread_only=unread_only,
            limit=max(1, min(limit, 100)),
            offset=max(0, offset),
        )
        return NotificationListResponse(
            items=[self._build_notification_read(item) for item in items],
            unread_count=self.notification_repository.count_unread(user_id=user_id),
        )

    def mark_read(self, *, user_id: str, notification_id: str) -> None:
        notification = self.notification_repository.get_notification(notification_id=notification_id, user_id=user_id)
        if notification is None:
            raise AppError("notification_not_found", "Уведомление не найдено.", 404)
        notification.site_read_at = notification.site_read_at or utc_now()
        self.notification_repository.save(notification)
        self.notification_repository.commit()

    def mark_all_read(self, *, user_id: str) -> int:
        count = self.notification_repository.mark_all_read(user_id=user_id, read_at=utc_now())
        self.notification_repository.commit()
        return count

    def publish(self, payload: NotificationPublishRequest) -> None:
        preference = self.notification_repository.get_or_create_preference(
            user_id=payload.user_id,
            topic=payload.topic,
        )
        telegram_link = self.telegram_repository.get_active_link_by_user_id(user_id=payload.user_id)
        notification = self.notification_repository.create_notification(
            user_id=payload.user_id,
            topic=payload.topic,
            level=payload.level,
            title=payload.title,
            message=payload.message,
            action_url=payload.action_url,
            machine_id=payload.machine_id,
            task_id=payload.task_id,
            result_id=payload.result_id,
            site_enabled=preference.site_enabled,
            telegram_enabled=preference.telegram_enabled and telegram_link is not None,
            telegram_status=(
                NotificationStatus.PENDING
                if preference.telegram_enabled and telegram_link is not None
                else None
            ),
        )
        self.notification_repository.save(notification)
        self.notification_repository.commit()

    def list_pending_telegram_notifications(self, *, limit: int = 20) -> list[TelegramNotificationDispatchRead]:
        items: list[TelegramNotificationDispatchRead] = []
        for notification in self.notification_repository.list_pending_telegram_notifications(limit=limit):
            link = self.telegram_repository.get_active_link_by_user_id(user_id=notification.user_id)
            if link is None:
                notification.telegram_enabled = False
                notification.telegram_status = None
                self.notification_repository.save(notification)
                continue
            lines = [f"{notification.title}", "", notification.message]
            if notification.action_url:
                lines.extend(["", notification.action_url])
            items.append(
                TelegramNotificationDispatchRead(
                    notification_id=notification.id,
                    telegram_user_id=link.telegram_user_id,
                    telegram_chat_id=link.telegram_chat_id,
                    text="\n".join(lines).strip(),
                )
            )
        self.notification_repository.commit()
        return items

    def mark_telegram_delivered(self, *, notification_id: str, telegram_user_id: str, telegram_chat_id: str) -> None:
        notification = self.notification_repository.get_notification_by_id(notification_id)
        if notification is None:
            raise AppError("notification_not_found", "Уведомление не найдено.", 404)
        link = self.telegram_repository.get_active_link_by_user_id(user_id=notification.user_id)
        if link is None or link.telegram_user_id != telegram_user_id or link.telegram_chat_id != telegram_chat_id:
            raise AppError("telegram_notification_forbidden", "Неверный Telegram-получатель.", 403)
        notification.telegram_status = NotificationStatus.DELIVERED
        notification.telegram_sent_at = utc_now()
        notification.telegram_error = None
        self.notification_repository.save(notification)
        self.notification_repository.commit()

    def mark_telegram_failed(self, *, notification_id: str, telegram_user_id: str, telegram_chat_id: str, error: str) -> None:
        notification = self.notification_repository.get_notification_by_id(notification_id)
        if notification is None:
            raise AppError("notification_not_found", "Уведомление не найдено.", 404)
        link = self.telegram_repository.get_active_link_by_user_id(user_id=notification.user_id)
        if link is None or link.telegram_user_id != telegram_user_id or link.telegram_chat_id != telegram_chat_id:
            raise AppError("telegram_notification_forbidden", "Неверный Telegram-получатель.", 403)
        notification.telegram_status = NotificationStatus.PENDING
        notification.telegram_error = error.strip()
        self.notification_repository.save(notification)
        self.notification_repository.commit()
