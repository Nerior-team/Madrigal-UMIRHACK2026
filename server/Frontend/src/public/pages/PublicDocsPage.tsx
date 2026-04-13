import { DOCS_PILLARS, DOCS_SECTIONS } from "../site-content";

export function PublicDocsPage() {
  return (
    <main className="public-page public-page--docs">
      <section className="public-docs-hero">
        <div className="public-docs-hero__copy">
          <span className="public-eyebrow">docs.nerior.store</span>
          <h1>Публичная документация</h1>
          <p>
            Структура уже готова под полноценную документацию по продуктам, API, интеграциям и
            практическим сценариям.
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
            {DOCS_SECTIONS.map((section) => (
              <a key={section.title} href={`#${section.title}`}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <section className="public-docs-content">
          <div className="public-docs-stack">
            {DOCS_SECTIONS.map((section) => (
              <article key={section.title} id={section.title} className="public-doc-card">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
