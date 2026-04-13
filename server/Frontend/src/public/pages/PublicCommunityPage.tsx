import { COMMUNITY_SECTIONS } from "../site-content";

export function PublicCommunityPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">community.nerior.store</span>
            <h1>Сообщество</h1>
          </div>
        </div>
        <div className="public-stack-grid">
          {COMMUNITY_SECTIONS.map((section) => (
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
