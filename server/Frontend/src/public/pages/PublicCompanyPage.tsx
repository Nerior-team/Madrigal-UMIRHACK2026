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
              Здесь должно быть финальное описание компании, позиционирования и продуктового
              контура Nerior.
            </p>
          </article>
          <article className="public-feature-card" id="careers">
            <h2>Карьера</h2>
            <p>Здесь должно быть описание команды, ролей, подхода к найму и направлений роста.</p>
          </article>
          <article className="public-feature-card" id="stories">
            <h2>Истории</h2>
            <p>Здесь должны быть кейсы, внутренние истории и продуктовые разборы.</p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <span className="public-eyebrow">Продукты</span>
            <h2>Crossplat, Smart planner и Karpik в одной экосистеме.</h2>
            <p>
              Здесь должно быть описание того, как продукты связаны внутри общей системы Nerior и
              чем отличается каждая сервисная зона.
            </p>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">Следующий этап</span>
            <h2>Что будет дальше в развитии компании.</h2>
            <p>
              Здесь должно быть описание будущего роста, новых сервисных зон и общих направлений
              развития компании.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
