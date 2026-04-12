import { Laptop, ShieldCheck, Smartphone } from "lucide-react";

import type { AccountSession } from "../../core/account";
import {
  getSessionKindLabel,
  getSessionRestrictionLabel,
  summarizeSession,
} from "../../core/account-ui";

type ProfileSessionsSectionProps = {
  sessions: AccountSession[];
  isLoading: boolean;
  isRevoking: boolean;
  notice?: string | null;
  error?: string | null;
  onRevoke: (sessionId: string) => void;
};

function getSessionIcon(session: AccountSession) {
  return session.sessionKind === "web" ? <Smartphone size={20} /> : <Laptop size={20} />;
}

export function ProfileSessionsSection({
  sessions,
  isLoading,
  isRevoking,
  notice,
  error,
  onRevoke,
}: ProfileSessionsSectionProps) {
  return (
    <section className="profile-card profile-card--sessions">
      <header className="profile-card__header">
        <h3>Активные сессии</h3>
        <p>Новая сессия не может завершать другие в течение первых 24 часов.</p>
      </header>

      {notice ? <p className="profile-card__notice">{notice}</p> : null}
      {error ? <p className="profile-card__error">{error}</p> : null}

      <div className="profile-sessions-list">
        {isLoading ? (
          <p className="profile-sessions-list__empty">Загружаем сессии...</p>
        ) : sessions.length ? (
          sessions.map((session) => {
            const restrictionLabel = getSessionRestrictionLabel(session);
            const canRevoke = session.canBeRevoked || session.isCurrent;

            return (
              <article
                key={session.id}
                className={
                  session.isCurrent
                    ? "profile-session-row profile-session-row--current"
                    : "profile-session-row"
                }
              >
                <div className="profile-session-row__content">
                  <span
                    className={
                      session.isCurrent
                        ? "profile-session-row__icon profile-session-row__icon--current"
                        : "profile-session-row__icon"
                    }
                    aria-hidden="true"
                  >
                    {getSessionIcon(session)}
                  </span>
                  <div className="profile-session-row__meta">
                    <div className="profile-session-row__title-line">
                      <strong>{getSessionKindLabel(session.sessionKind)}</strong>
                      {session.isCurrent ? (
                        <span className="profile-session-row__current">Текущая</span>
                      ) : null}
                    </div>
                    <p>{summarizeSession(session)}</p>
                    {restrictionLabel ? (
                      <span className="profile-session-row__hint">
                        <ShieldCheck size={14} />
                        {restrictionLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-session-row__terminate"
                  onClick={() => onRevoke(session.id)}
                  disabled={isRevoking || !canRevoke}
                >
                  {session.isCurrent ? "Выйти" : "Завершить"}
                </button>
              </article>
            );
          })
        ) : (
          <p className="profile-sessions-list__empty">Активных сессий нет.</p>
        )}
      </div>
    </section>
  );
}
