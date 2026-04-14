export function PublicCompanyPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Компания</span>
            <h1>О компании, продуктах и следующем контуре роста.</h1>
            <p>
              Публичная страница компании должна объяснять, как устроен Nerior, какие продукты уже активны, какие
              появятся позже и почему экосистема разделена на отдельные домены и сервисные зоны.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card" id="about">
            <h2>О нас</h2>
            <p>
              Nerior строит инфраструктуру вокруг продуктов, рабочих интерфейсов, документации и сервисных зон так,
              чтобы компания могла расти без хаотичного накопления интерфейсов и технических слоёв.
            </p>
          </article>
          <article className="public-feature-card" id="careers">
            <h2>Карьера</h2>
            <p>
              Компания растёт вокруг продуктовой дисциплины, инфраструктуры и разработческого контура. Здесь
              должен быть блок про команду, роли и подход к найму.
            </p>
          </article>
          <article className="public-feature-card" id="stories">
            <h2>Истории</h2>
            <p>
              Раздел под будущие кейсы, внутренние разборы, продуктовые повороты и объяснение того, как экосистема
              Nerior развивалась до текущей структуры.
            </p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <span className="public-eyebrow">Продукты</span>
            <h2>Crossplat, Smart-Planner и Karpik в одной экосистеме.</h2>
            <p>
              Crossplat уже активен как рабочий продукт. Smart-Planner и Karpik пока не доступны публично, но
              уже встроены в доменную и навигационную структуру.
            </p>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">Следующий этап</span>
            <h2>Рост без переизобретения общей системы.</h2>
            <p>
              Следующие продукты, developer surfaces и support-разделы включаются в уже существующую схему
              доменов, не ломая публичный сайт и не смешивая сценарии в одном месте.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
