export function PublicCompanyPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Компания</span>
            <h1>О компании, продуктах и следующем контуре роста.</h1>
          </div>
        </div>
        <div className="public-stack-grid">
          <article className="public-story-card" id="about">
            <h2>О нас</h2>
            <p>
              Здесь будет финальное описание компании, позиционирования и продуктового контура
              Nerior.
            </p>
          </article>
          <article className="public-story-card" id="careers">
            <h2>Карьера</h2>
            <p>Здесь будет описание команды, ролей и найма.</p>
          </article>
          <article className="public-story-card" id="stories">
            <h2>Истории</h2>
            <p>Здесь будут кейсы, внутренние истории и продуктовые разборы.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
