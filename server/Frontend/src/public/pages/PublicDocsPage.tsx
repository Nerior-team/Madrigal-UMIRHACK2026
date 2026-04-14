import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DOCS_LIBRARY_GROUPS, DOCS_PILLARS, DOCS_SECTIONS } from "../site-content";

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

const DOC_LINKS = [
  { label: "Обзор", slug: "" },
  { label: "Начало работы", slug: "getting-started" },
  { label: "Crossplat", slug: "crossplat" },
  { label: "API", slug: "api" },
  { label: "Руководства", slug: "guides" },
  { label: "Справочник", slug: "reference" },
  { label: "FAQ", slug: "faq" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "#b8d975",
  POST: "#88b9ff",
};

function resolveSlug(pathname: string): string {
  const normalized = pathname.replace(/^\/+/, "");
  return normalized || "";
}

export function PublicDocsPage() {
  const location = useLocation();
  const slug = useMemo(() => resolveSlug(location.pathname), [location.pathname]);
  const section = DOCS_SECTIONS.find((item) => item.slug === slug);

  return (
    <main className="public-page public-page--docs">
      <section className="public-docs-hero">
        <div className="public-docs-hero__copy">
          <span className="public-eyebrow">docs.nerior.store</span>
          <h1>Документация Nerior</h1>
          <p>
            Публичная библиотека материалов по продуктам, внешнему API, рабочим сценариям и support-маршрутам.
            Раздел не смешивается с корпоративным сайтом и не зависит от продуктового интерфейса Crossplat.
          </p>
        </div>

        <div className="public-feature-grid">
          {DOCS_PILLARS.map((item) => (
            <article key={item.title} className="public-feature-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="public-docs-layout">
        <aside className="public-docs-sidebar">
          <span className="public-eyebrow">Навигация</span>
          <nav>
            {DOC_LINKS.map((item) => (
              <a
                key={item.slug || "root"}
                href={item.slug ? `https://docs.nerior.store/${item.slug}` : "https://docs.nerior.store/"}
                className={slug === item.slug ? "is-active" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section className="public-docs-content">
          {section ? (
            <article className="public-doc-card">
              <span className="public-eyebrow">Раздел</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.slug === "api" || section.slug === "reference" ? (
                <div className="public-reference-table">
                  {REFERENCE_ROUTES.map((route) => (
                    <div key={route.path} className="public-reference-row">
                      <span style={{ color: METHOD_COLORS[route.method] ?? "#fff" }}>{route.method}</span>
                      <code>{route.path}</code>
                      <p>{route.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ) : (
            <div className="public-docs-stack">
              {DOCS_SECTIONS.map((entry) => (
                <article key={entry.slug} className="public-doc-card">
                  <span className="public-eyebrow">Раздел</span>
                  <h2>{entry.title}</h2>
                  <p>{entry.body}</p>
                  <a href={`https://docs.nerior.store/${entry.slug}`} className="public-inline-link">
                    Открыть раздел
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Библиотека</span>
            <h2>Материалы разложены по типам, а не свалены в одну длинную страницу.</h2>
          </div>
        </div>
        <div className="public-library-grid">
          {DOCS_LIBRARY_GROUPS.map((group) => (
            <article key={group.title} className="public-story-card">
              <span className="public-eyebrow">Коллекция</span>
              <h2>{group.title}</h2>
              <ul className="public-card-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
