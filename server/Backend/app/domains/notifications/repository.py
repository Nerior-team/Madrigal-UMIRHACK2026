from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domains.notifications.models import UserNotification, UserNotificationPreference
from app.shared.enums import NotificationStatus, NotificationTopic


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_preferences(self, user_id: str) -> list[UserNotificationPreference]:
        return list(
            self.db.scalars(
                select(UserNotificationPreference)
                .where(UserNotificationPreference.user_id == user_id)
                .order_by(UserNotificationPreference.topic.asc())
            )
        )

    def get_preference(self, *, user_id: str, topic: NotificationTopic) -> UserNotificationPreference | None:
        return self.db.scalar(
            select(UserNotificationPreference).where(
                UserNotificationPreference.user_id == user_id,
                UserNotificationPreference.topic == topic,
            )
        )

    def get_or_create_preference(self, *, user_id: str, topic: NotificationTopic) -> UserNotificationPreference:
        preference = self.get_preference(user_id=user_id, topic=topic)
        if preference is not None:
            return preference
        preference = UserNotificationPreference(user_id=user_id, topic=topic)
        self.db.add(preference)
        self.db.flush()
        return preference

    def create_notification(
        self,
        *,
        user_id: str,
        topic,
        level,
        title: str,
        message: str,
        action_url: str | None,
        machine_id: str | None,
        task_id: str | None,
        result_id: str | None,
        site_enabled: bool,
        telegram_enabled: bool,
        telegram_status: NotificationStatus | None,
    ) -> UserNotification:
        notification = UserNotification(
            user_id=user_id,
            topic=topic,
            level=level,
            title=title,
            message=message,
            action_url=action_url,
            machine_id=machine_id,
            task_id=task_id,
            result_id=result_id,
            site_enabled=site_enabled,
            telegram_enabled=telegram_enabled,
            telegram_status=telegram_status,
        )
        self.db.add(notification)
        self.db.flush()
        return notification

    def list_notifications(self, *, user_id: str, unread_only: bool, limit: int, offset: int) -> list[UserNotification]:
        statement = select(UserNotification).where(UserNotification.user_id == user_id)
        if unread_only:
            statement = statement.where(
                UserNotification.site_enabled.is_(True),
                UserNotification.site_read_at.is_(None),
            )
        statement = statement.order_by(UserNotification.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(statement))

    def count_unread(self, *, user_id: str) -> int:
        return int(
            self.db.scalar(
                select(func.count(UserNotification.id)).where(
                    UserNotification.user_id == user_id,
                    UserNotification.site_enabled.is_(True),
                    UserNotification.site_read_at.is_(None),
                )
            )
            or 0
        )

    def get_notification(self, *, notification_id: str, user_id: str) -> UserNotification | None:
        return self.db.scalar(
            select(UserNotification).where(
                UserNotification.id == notification_id,
                UserNotification.user_id == user_id,
            )
        )

    def get_notification_by_id(self, notification_id: str) -> UserNotification | None:
        return self.db.get(UserNotification, notification_id)

    def mark_all_read(self, *, user_id: str, read_at) -> int:
        notifications = list(
            self.db.scalars(
                select(UserNotification).where(
                    UserNotification.user_id == user_id,
                    UserNotification.site_enabled.is_(True),
                    UserNotification.site_read_at.is_(None),
                )
            )
        )
        for item in notifications:
            item.site_read_at = read_at
            self.db.add(item)
        self.db.flush()
        return len(notifications)

    def list_pending_telegram_notifications(self, *, limit: int) -> list[UserNotification]:
        return list(
            self.db.scalars(
                select(UserNotification)
                .where(
                    UserNotification.telegram_enabled.is_(True),
                    UserNotification.telegram_status == NotificationStatus.PENDING,
                )
                .order_by(UserNotification.created_at.asc())
                .limit(limit)
            )
        )

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()
