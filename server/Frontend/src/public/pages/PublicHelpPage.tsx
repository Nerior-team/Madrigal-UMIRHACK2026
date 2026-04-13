import { HELP_PILLARS, HELP_SECTIONS } from "../site-content";

export function PublicHelpPage() {
  return (
    <main className="public-page public-page--help">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">help.nerior.store</span>
            <h1>Справочный центр</h1>
            <p>
              Публичная справочная поверхность для новых пользователей, операционных вопросов и
              маршрутизации в нужный сервис.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          {HELP_PILLARS.map((item) => (
            <article key={item.title} className="public-feature-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="public-stack-grid">
          {HELP_SECTIONS.map((section) => (
            <article key={section.title} className="public-story-card">
              <span className="public-eyebrow">Маршрут</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
