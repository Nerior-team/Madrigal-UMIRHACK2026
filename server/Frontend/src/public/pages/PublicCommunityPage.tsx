import { COMMUNITY_PILLARS, COMMUNITY_SECTIONS } from "../site-content";

export function PublicCommunityPage() {
  return (
    <main className="public-page public-page--community">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">community.nerior.store</span>
            <h1>Сообщество</h1>
            <p>
              Публичная зона обсуждений, материалов и командных анонсов. Финальный контент можно
              будет наполнить без переделки общей структуры.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          {COMMUNITY_PILLARS.map((item) => (
            <article key={item.title} className="public-feature-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="public-stack-grid">
          {COMMUNITY_SECTIONS.map((section) => (
            <article key={section.title} className="public-story-card">
              <span className="public-eyebrow">Раздел</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
