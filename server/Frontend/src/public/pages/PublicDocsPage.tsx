import { DOCS_SECTIONS } from "../site-content";

export function PublicDocsPage() {
  return (
    <main className="public-page public-page--docs">
      <aside className="public-docs-sidebar">
        <span className="public-eyebrow">Документация</span>
        <nav>
          {DOCS_SECTIONS.map((section) => (
            <a key={section.title} href={`#${section.title}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </aside>
      <section className="public-docs-content">
        <header className="public-section__header">
          <div>
            <span className="public-eyebrow">docs.nerior.store</span>
            <h1>Публичная документация</h1>
          </div>
        </header>
        <div className="public-docs-stack">
          {DOCS_SECTIONS.map((section) => (
            <article key={section.title} id={section.title} className="public-doc-card">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
