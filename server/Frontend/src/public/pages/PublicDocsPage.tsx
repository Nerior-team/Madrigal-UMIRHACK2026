import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { PublicSubnav } from "../components/PublicSubnav";
import { DOCS_LIBRARY_GROUPS, DOCS_SECTIONS } from "../site-content";

const DOCS_LINKS = [
  { label: "Начало работы", href: "/" },
  { label: "Crossplat", href: "/crossplat" },
  { label: "API", href: "/api" },
  { label: "Руководства", href: "/guides" },
  { label: "Справочник", href: "/reference" },
  { label: "Продукты", href: "/products" },
  { label: "FAQ", href: "/faq" },
];

const DOCS_GROUPS = [
  { section: "Начало работы", links: [{ label: "Обзор", href: "/" }] },
  { section: "Crossplat", links: [{ label: "Что такое Crossplat", href: "/crossplat" }] },
  {
    section: "API и интеграции",
    links: [
      { label: "Обзор API", href: "/api" },
      { label: "Машины", href: "/api#machines" },
      { label: "Задачи", href: "/api#tasks" },
      { label: "Результаты", href: "/api#results" },
    ],
  },
  { section: "Руководства", links: [{ label: "Практические сценарии", href: "/guides" }] },
  { section: "Справочник", links: [{ label: "Все маршруты", href: "/reference" }] },
  { section: "Продукты", links: [{ label: "Обзор продуктов", href: "/products" }] },
  { section: "FAQ", links: [{ label: "Частые вопросы", href: "/faq" }] },
];

const REFERENCE_ROUTES = [
  { method: "GET", path: "/api/v1/external/machines", description: "Список машин, доступных по ключу." },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}", description: "Детали конкретной машины." },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}/commands", description: "Разрешённые команды машины." },
  { method: "POST", path: "/api/v1/external/tasks", description: "Создание новой задачи." },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}", description: "Состояние и метаданные задачи." },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}/logs", description: "Логи конкретной задачи." },
  { method: "GET", path: "/api/v1/external/results/{result_id}", description: "Карточка результата." },
  { method: "GET", path: "/api/v1/external/results/{result_id}/summary", description: "Краткая сводка результата." },
  { method: "GET", path: "/api/v1/external/results/{result_id}/export/json", description: "Экспорт результата в JSON." },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "#b5f542",
  POST: "#60a5fa",
};

function resolveSlug(pathname: string): string {
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function PublicDocsPage() {
  const location = useLocation();
  const slug = useMemo(() => resolveSlug(location.pathname), [location.pathname]);
  const section = DOCS_SECTIONS.find((item) => item.slug === slug);

  return (
    <>
      <PublicSubnav brand="Документация" brandHref="/" links={DOCS_LINKS} />

      <div style={{ paddingTop: "var(--n-nav-h)", display: "flex", minHeight: "100vh", background: "#000", color: "#fff" }}>
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            padding: "2rem 0",
            position: "sticky",
            top: "var(--n-nav-h)",
            height: "calc(100vh - var(--n-nav-h))",
            overflowY: "auto",
          }}
        >
          {DOCS_GROUPS.map((group) => (
            <div key={group.section} style={{ marginBottom: "1.75rem", padding: "0 1.25rem" }}>
              <p style={sidebarSectionStyle}>{group.section}</p>
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={`https://docs.nerior.store${link.href}`}
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.55)",
                    padding: "0.25rem 0",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: "3rem 3rem 6rem", maxWidth: "740px" }}>
          {section ? (
            <SectionView section={section} />
          ) : (
            <>
              <p style={eyebrowStyle}>docs.nerior.store</p>
              <h1 style={heroTitleStyle}>Документация Nerior</h1>
              <p style={heroBodyStyle}>
                Документация разделена по продуктам, API, практическим сценариям и справочным материалам. Это не единая база
                знаний, а библиотека по разным слоям системы.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {DOCS_SECTIONS.map((entry, index) => (
                  <a
                    key={entry.slug}
                    href={`https://docs.nerior.store/${entry.slug}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: "1.5rem",
                      padding: "1.5rem 0",
                      borderBottom: index < DOCS_SECTIONS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <h3 style={entryTitleStyle}>{entry.title}</h3>
                    <p style={entryBodyStyle}>{entry.body}</p>
                  </a>
                ))}
              </div>

              <div style={{ display: "grid", gap: "1.25rem", marginTop: "3rem" }}>
                {DOCS_LIBRARY_GROUPS.map((group) => (
                  <article
                    key={group.title}
                    style={{
                      padding: "1.5rem",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "0.375rem",
                      display: "grid",
                      gap: "0.9rem",
                    }}
                  >
                    <span style={eyebrowStyle}>Коллекция</span>
                    <h2 style={{ fontSize: "1.125rem", color: "#fff", margin: 0 }}>{group.title}</h2>
                    <ul style={listStyle}>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

function SectionView({
  section,
}: {
  section: (typeof DOCS_SECTIONS)[number];
}) {
  return (
    <>
      <p style={eyebrowStyle}>Раздел</p>
      <h1 style={heroTitleStyle}>{section.title}</h1>
      <p style={heroBodyStyle}>{section.body}</p>

      {section.slug === "api" || section.slug === "reference" ? (
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "2rem" }}>
          {REFERENCE_ROUTES.map((route, index) => (
            <div
              key={route.path}
              style={{
                display: "grid",
                gap: "0.45rem",
                paddingTop: index === 0 ? 0 : "0.85rem",
                borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: METHOD_COLORS[route.method] ?? "#fff" }}>{route.method}</span>
              <code style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>{route.path}</code>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{route.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

const sidebarSectionStyle = {
  fontSize: "0.625rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.25)",
  marginBottom: "0.5rem",
} as const;

const eyebrowStyle = {
  fontSize: "0.6875rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: "1rem",
} as const;

const heroTitleStyle = {
  fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  lineHeight: 1.12,
  marginBottom: "1.25rem",
  color: "#fff",
} as const;

const heroBodyStyle = {
  fontSize: "1rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.7,
  marginBottom: "2rem",
  maxWidth: "560px",
} as const;

const entryTitleStyle = {
  fontSize: "0.9375rem",
  fontWeight: 600,
  color: "#fff",
  margin: 0,
  lineHeight: 1.35,
} as const;

const entryBodyStyle = {
  fontSize: "0.875rem",
  color: "rgba(255,255,255,0.45)",
  margin: 0,
  lineHeight: 1.6,
} as const;

const listStyle = {
  margin: 0,
  paddingLeft: "1rem",
  display: "grid",
  gap: "0.5rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.6,
} as const;
