export function PublicCompanyPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Компания</span>
            <h1>О компании, продуктах и следующем контуре роста.</h1>
            <p>
              Публичная страница компании должна давать ясное представление о Nerior, линейке
              продуктов и направлениях развития без лишнего интерфейсного шума.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card" id="about">
            <h2>О нас</h2>
            <p>
              Здесь будет финальное описание компании, позиционирования и продуктового контура
              Nerior.
            </p>
          </article>
          <article className="public-feature-card" id="careers">
            <h2>Карьера</h2>
            <p>Здесь будет описание команды, ролей и найма.</p>
          </article>
          <article className="public-feature-card" id="stories">
            <h2>Истории</h2>
            <p>Здесь будут кейсы, внутренние истории и продуктовые разборы.</p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <h2>Продукты</h2>
            <p>
              Здесь должно быть описание того, как Crossplat, Smart-Planner и Karpik связаны внутри
              общей экосистемы Nerior.
            </p>
          </article>
          <article className="public-story-card">
            <h2>Следующий этап</h2>
            <p>
              Здесь должно быть описание будущего роста компании, новых сервисных зон и общих
              направлений развития.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
