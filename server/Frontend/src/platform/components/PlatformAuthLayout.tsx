import type { PropsWithChildren } from "react";

export function PlatformAuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="platform-auth-layout" data-testid="platform-auth-layout">
      <aside className="platform-auth-layout__aside">
        <a className="platform-auth-layout__brand" href="/">
          <span className="platform-auth-layout__mark">N</span>
          <div>
            <strong>Nerior API</strong>
            <span>{"\u041e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f"}</span>
          </div>
        </a>
        <div className="platform-auth-layout__copy">
          <span className="platform-eyebrow">API</span>
          <h1>{"\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043a\u043b\u044e\u0447\u0430\u043c\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u0434\u043b\u044f \u0441\u0435\u0440\u0432\u0438\u0441\u043e\u0432 Nerior."}</h1>
          <p>
            {"\u041e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0439 \u0432\u0445\u043e\u0434, \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0435 \u0441\u0435\u0441\u0441\u0438\u0438, \u0432\u044b\u043f\u0443\u0441\u043a \u043a\u043b\u044e\u0447\u0435\u0439, \u043e\u0442\u0437\u044b\u0432 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u0438 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c usage \u0432 \u043e\u0434\u043d\u043e\u043c \u043a\u0430\u0431\u0438\u043d\u0435\u0442\u0435."}
          </p>
        </div>
      </aside>
      <main className="platform-auth-layout__main">{children}</main>
    </div>
  );
}
