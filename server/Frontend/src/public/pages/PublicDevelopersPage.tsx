const DEV_ZONES = [
  {
    name: "Документация",
    host: "docs.nerior.store",
    href: "https://docs.nerior.store",
    desc: "Структурированная база знаний: продуктовые разделы, API-маршруты, практические руководства и справочные материалы. Не нужна авторизация.",
  },
  {
    name: "API",
    host: "api.nerior.store",
    href: "https://api.nerior.store",
    desc: "Кабинет управления API-ключами. Здесь создаются и отзываются ключи, настраиваются scopes и просматривается аналитика использования. Требует авторизации.",
  },
  {
    name: "Сообщество",
    host: "community.nerior.store",
    href: "https://community.nerior.store",
    desc: "Зона публичных обсуждений, анонсов, открытых материалов и архивов. Здесь происходит взаимодействие между пользователями и разработчиками.",
  },
  {
    name: "Справка",
    host: "help.nerior.store",
    href: "https://help.nerior.store",
    desc: "Справочный центр с маршрутизацией по аудиториям: новым пользователям, командам и службе поддержки. Без авторизации.",
  },
];

const API_ROUTES = [
  { method: "GET", path: "/api/v1/external/machines", label: "Список машин" },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}", label: "Детали машины" },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}/commands", label: "Команды машины" },
  { method: "POST", path: "/api/v1/external/tasks", label: "Создать задачу" },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}", label: "Просмотр задачи" },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}/logs", label: "Логи задачи" },
  { method: "GET", path: "/api/v1/external/results/{result_id}", label: "Результат" },
  { method: "GET", path: "/api/v1/external/results/{result_id}/summary", label: "Сводка результата" },
  { method: "GET", path: "/api/v1/external/results/{result_id}/export/json", label: "Экспорт JSON" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "#b5f542",
  POST: "#60a5fa",
};

export function PublicDevelopersPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 1.75rem 4rem" }}>
        <p style={eyebrowStyle}>Разработчикам</p>
        <h1 style={heroTitleStyle}>Разработческие поверхности Nerior</h1>
        <p style={heroBodyStyle}>
          У Nerior есть четыре отдельные developer-facing зоны. Каждая решает свою задачу и живёт
          на отдельном хосте.
        </p>
      </section>

      <div style={dividerStyle} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4.5rem 1.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {DEV_ZONES.map((zone, index) => (
            <a
              key={zone.name}
              href={zone.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr auto",
                gap: "2rem",
                padding: "2rem 0",
                borderBottom: index < DEV_ZONES.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                alignItems: "start",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.opacity = "1";
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff", marginBottom: "0.35rem" }}>{zone.name}</h3>
                <code style={hostCodeStyle}>{zone.host}</code>
              </div>
              <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>{zone.desc}</p>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "1rem", paddingTop: "0.2rem" }}>↗</span>
            </a>
          ))}
        </div>
      </section>

      <div style={dividerStyle} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4.5rem 1.75rem 7rem" }}>
        <p style={{ ...eyebrowStyle, marginBottom: "1.75rem" }}>Внешний API — маршруты</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {API_ROUTES.map((route, index) => (
            <div
              key={route.path}
              style={{
                display: "grid",
                gridTemplateColumns: "52px 1fr 200px",
                alignItems: "center",
                padding: "0.875rem 0",
                borderBottom: index < API_ROUTES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                gap: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: METHOD_COLORS[route.method] ?? "#fff",
                  fontFamily: "monospace",
                }}
              >
                {route.method}
              </span>
              <code
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {route.path}
              </code>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>{route.label}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "1.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
          Полная документация по API — на{" "}
          <a
            href="https://docs.nerior.store/api"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineAnchorStyle}
          >
            docs.nerior.store/api
          </a>
          . Ключи доступа выдаются в кабинете{" "}
          <a
            href="https://api.nerior.store"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineAnchorStyle}
          >
            api.nerior.store
          </a>
          .
        </p>
      </section>
    </main>
  );
}

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "0 1.75rem",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "1.5rem",
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: "clamp(2rem, 5vw, 3.75rem)",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  marginBottom: "1.5rem",
  maxWidth: "640px",
};

const heroBodyStyle: React.CSSProperties = {
  fontSize: "1.0625rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.65,
  maxWidth: "560px",
};

const hostCodeStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.3)",
  fontFamily: "monospace",
};

const inlineAnchorStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  paddingBottom: "1px",
  textDecoration: "none",
};
