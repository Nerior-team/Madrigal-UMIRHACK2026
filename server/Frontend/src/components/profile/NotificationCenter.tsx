import { Bell } from "lucide-react";

import type { AccountNotification } from "../../core/account";
import { getNotificationTopicLabel } from "../../core/account-ui";

type NotificationCenterProps = {
  items: AccountNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
  onMarkRead: (notificationId: string) => void;
  onOpenAll: () => void;
};

export function NotificationCenter({
  items,
  unreadCount,
  isOpen,
  onToggle,
  onNavigate,
  onMarkRead,
  onOpenAll,
}: NotificationCenterProps) {
  return (
    <div
      className={
        isOpen
          ? "notification-center notification-center--open"
          : "notification-center"
      }
    >
      <button
        type="button"
        className="notification-center__trigger"
        aria-label="Уведомления"
        onClick={onToggle}
      >
        <Bell size={18} />
        {unreadCount ? (
          <span className="notification-center__badge">{unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="notification-center__dropdown">
          <div className="notification-center__header">
            <strong>Уведомления</strong>
            <button type="button" onClick={onOpenAll}>
              Все настройки
            </button>
          </div>

          {items.length ? (
            <div className="notification-center__list">
              {items.slice(0, 6).map((item) => (
                <article
                  key={item.id}
                  className={
                    item.siteRead
                      ? "notification-center__item"
                      : "notification-center__item notification-center__item--unread"
                  }
                >
                  <div className="notification-center__meta">
                    <span>{getNotificationTopicLabel(item.topic)}</span>
                    <span>{item.createdAtLabel}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <div className="notification-center__actions">
                    {!item.siteRead ? (
                      <button type="button" onClick={() => onMarkRead(item.id)}>
                        Прочитать
                      </button>
                    ) : null}
                    {item.actionUrl ? (
                      <button
                        type="button"
                        onClick={() => onNavigate(item.actionUrl ?? "")}
                      >
                        Открыть
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="notification-center__empty">Новых уведомлений нет.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
