import type {
  AccountNotification,
  NotificationPreferenceMap,
  NotificationTopic,
} from "../../core/account";
import {
  getNotificationLevelLabel,
  getNotificationTopicLabel,
} from "../../core/account-ui";

type ProfileNotificationsSectionProps = {
  preferences: NotificationPreferenceMap;
  notifications: AccountNotification[];
  unreadCount: number;
  isLoading: boolean;
  isSaving: boolean;
  notice?: string | null;
  error?: string | null;
  onToggle: (
    topic: NotificationTopic,
    channel: "siteEnabled" | "telegramEnabled",
    value: boolean,
  ) => void;
  onSave: () => void;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (href: string) => void;
};

export function ProfileNotificationsSection({
  preferences,
  notifications,
  unreadCount,
  isLoading,
  isSaving,
  notice,
  error,
  onToggle,
  onSave,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: ProfileNotificationsSectionProps) {
  return (
    <section className="profile-card profile-card--notifications">
      <header className="profile-card__header">
        <div>
          <h3>Уведомления</h3>
          <p>Настройте каналы доставки и просматривайте ленту событий.</p>
        </div>
        <button
          type="button"
          className="profile-inline-action"
          onClick={onMarkAllRead}
          disabled={!unreadCount}
        >
          Прочитать все
        </button>
      </header>

      <div className="profile-notification-preferences">
        {Object.values(preferences).map((item) => (
          <article key={item.topic} className="profile-notification-preference">
            <div>
              <strong>{getNotificationTopicLabel(item.topic)}</strong>
              <p>
                {item.topic === "security"
                  ? "Для событий безопасности рекомендуем включать оба канала."
                  : "События будут приходить только в выбранные каналы."}
              </p>
            </div>
            <div className="profile-notification-preference__toggles">
              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={item.siteEnabled}
                  onChange={(event) =>
                    onToggle(item.topic, "siteEnabled", event.target.checked)
                  }
                />
                <span>Сайт</span>
              </label>
              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={item.telegramEnabled}
                  onChange={(event) =>
                    onToggle(item.topic, "telegramEnabled", event.target.checked)
                  }
                />
                <span>Telegram</span>
              </label>
            </div>
          </article>
        ))}
      </div>

      {notice ? <p className="profile-card__notice">{notice}</p> : null}
      {error ? <p className="profile-card__error">{error}</p> : null}

      <div className="profile-card__actions">
        <button
          type="button"
          className="profile-action-button"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Сохраняем..." : "Сохранить настройки"}
        </button>
      </div>

      <div className="profile-notification-feed">
        <div className="profile-notification-feed__header">
          <strong>Лента событий</strong>
          <span>{unreadCount ? `Новых: ${unreadCount}` : "Новых нет"}</span>
        </div>

        {isLoading ? (
          <p className="profile-notification-feed__empty">
            Загружаем уведомления...
          </p>
        ) : notifications.length ? (
          <div className="profile-notification-feed__list">
            {notifications.map((notification) => {
              const actionUrl = notification.actionUrl ?? "";

              return (
                <article
                  key={notification.id}
                  className={
                    notification.siteRead
                      ? "profile-notification-item"
                      : "profile-notification-item profile-notification-item--unread"
                  }
                >
                  <div className="profile-notification-item__meta">
                    <span>{getNotificationTopicLabel(notification.topic)}</span>
                    <span>{getNotificationLevelLabel(notification.level)}</span>
                    <span>{notification.createdAtLabel}</span>
                  </div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <div className="profile-notification-item__actions">
                    {!notification.siteRead ? (
                      <button type="button" onClick={() => onMarkRead(notification.id)}>
                        Прочитать
                      </button>
                    ) : null}
                    {actionUrl ? (
                      <button type="button" onClick={() => onNavigate(actionUrl)}>
                        Открыть
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="profile-notification-feed__empty">
            Уведомлений пока нет.
          </p>
        )}
      </div>
    </section>
  );
}
