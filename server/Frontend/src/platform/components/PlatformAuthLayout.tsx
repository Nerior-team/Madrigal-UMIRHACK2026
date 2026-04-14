import type { PropsWithChildren } from "react";

export function PlatformAuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="platform-auth-layout" data-testid="platform-auth-layout">
      <aside className="platform-auth-layout__aside">
        <a className="platform-auth-layout__brand" href="/">
          <span className="platform-auth-layout__mark">N</span>
          <div>
            <strong>Nerior API</strong>
            <span>Отдельный доступ</span>
          </div>
        </a>
        <div className="platform-auth-layout__copy">
          <span className="platform-eyebrow">API</span>
          <h1>Управление ключами доступа для сервисов Nerior.</h1>
          <p>
            Отдельный вход, отдельные сессии, выпуск ключей, отзыв доступа и видимость usage в
            одном кабинете.
          </p>
        </div>
      </aside>
      <main className="platform-auth-layout__main">{children}</main>
    </div>
  );
}
