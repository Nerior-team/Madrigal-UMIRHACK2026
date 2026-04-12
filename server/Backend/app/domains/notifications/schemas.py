from datetime import datetime

from pydantic import BaseModel, Field

from app.shared.enums import NotificationLevel, NotificationStatus, NotificationTopic


class NotificationPreferenceRead(BaseModel):
    topic: NotificationTopic
    site_enabled: bool
    telegram_enabled: bool


class NotificationPreferencesRead(BaseModel):
    items: list[NotificationPreferenceRead]


class NotificationPreferenceUpdateItem(BaseModel):
    topic: NotificationTopic
    site_enabled: bool = True
    telegram_enabled: bool = False


class NotificationPreferencesUpdateRequest(BaseModel):
    items: list[NotificationPreferenceUpdateItem] = Field(default_factory=list)


class UserNotificationRead(BaseModel):
    id: str
    topic: NotificationTopic
    level: NotificationLevel
    title: str
    message: str
    action_url: str | None = None
    machine_id: str | None = None
    task_id: str | None = None
    result_id: str | None = None
    site_read: bool
    telegram_enabled: bool
    telegram_status: NotificationStatus | None = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[UserNotificationRead]
    unread_count: int


class TelegramNotificationDispatchRead(BaseModel):
    notification_id: str
    telegram_user_id: str
    telegram_chat_id: str
    text: str


class TelegramNotificationDeliveryRequest(BaseModel):
    telegram_user_id: str
    telegram_chat_id: str
    message_id: int


class TelegramNotificationFailureRequest(BaseModel):
    telegram_user_id: str
    telegram_chat_id: str
    error: str = Field(min_length=1, max_length=512)
