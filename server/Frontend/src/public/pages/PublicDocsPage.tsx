import { DOCS_LIBRARY_GROUPS, DOCS_PILLARS, DOCS_SECTIONS } from "../site-content";

const DOCS_SURFACES = [
  {
    eyebrow: "docs.nerior.store",
    title: "Продуктовые руководства",
    body: "Здесь должно быть описание структуры продуктовой документации, сценариев использования и связей между разделами.",
    href: "#section-0",
    linkLabel: "Открыть обзор",
  },
  {
    eyebrow: "api.nerior.store",
    title: "API и ключи доступа",
    body: "Здесь должно быть описание кабинета API, ключей доступа, scopes и маршрута к связанным материалам.",
    href: "https://api.nerior.store",
    linkLabel: "Перейти в API",
  },
  {
    eyebrow: "help.nerior.store",
    title: "Справка и поддержка",
    body: "Здесь должно быть описание быстрых ответов, маршрутов поддержки и переходов к справочным материалам.",
    href: "https://help.nerior.store",
    linkLabel: "Открыть help",
  },
] as const;

export function PublicDocsPage() {
  return (
    <main className="public-page public-page--docs">
      <section className="public-docs-hero">
        <div className="public-docs-hero__copy">
          <span className="public-eyebrow">docs.nerior.store</span>
          <h1>Документация Nerior</h1>
          <p>
            Публичная библиотека материалов по продуктам, API, рабочим сценариям и справочным структурам. Здесь уже готова
            демонстрационная карта разделов, в которую потом можно без переделки вносить финальный текст.
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

      <section className="public-section public-section--docs-surface">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Маршруты</span>
            <h2>Документация разложена по поверхностям, а не собрана в один перегруженный раздел.</h2>
          </div>
        </div>

        <div className="public-link-grid">
          {DOCS_SURFACES.map((surface) => (
            <article key={surface.title} className="public-story-card">
              <span className="public-eyebrow">{surface.eyebrow}</span>
              <h2>{surface.title}</h2>
              <p>{surface.body}</p>
              <div className="public-story-card__links">
                <a href={surface.href} className="public-inline-link">
                  {surface.linkLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="public-docs-layout">
        <aside className="public-docs-sidebar">
          <span className="public-eyebrow">Навигация</span>
          <nav>
            {DOCS_SECTIONS.map((section, index) => (
              <a key={section.title} href={`#section-${index}`}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <section className="public-docs-content">
          <div className="public-docs-stack">
            {DOCS_SECTIONS.map((section, index) => (
              <article key={section.title} id={`section-${index}`} className="public-doc-card">
                <span className="public-eyebrow">Раздел {index + 1}</span>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Библиотека</span>
            <h2>Готовые контейнеры под будущие материалы, роуты, схемы и руководства.</h2>
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
