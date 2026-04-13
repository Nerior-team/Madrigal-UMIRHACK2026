import { HELP_SECTIONS } from "../site-content";

export function PublicHelpPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">help.nerior.store</span>
            <h1>Справочный центр</h1>
          </div>
        </div>
        <div className="public-stack-grid">
          {HELP_SECTIONS.map((section) => (
            <article key={section.title} className="public-story-card">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
