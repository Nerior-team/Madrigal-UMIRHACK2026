export function PublicDevelopersPage() {
  return (
    <main className="public-page public-page--developers">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Разработчикам</span>
            <h1>Документы, API и сообщество в отдельных пространствах.</h1>
            <p>
              У Nerior публичная документация, отдельный кабинет API и отдельная зона сообщества.
              Каждая поверхность решает свою задачу и не смешивается с продуктовым интерфейсом.
            </p>
          </div>
        </div>
        <div className="public-stack-grid">
          <article className="public-story-card">
            <span className="public-eyebrow">docs.nerior.store</span>
            <h2>Документация</h2>
            <p>Публичная техническая документация со структурой под разные типы материалов.</p>
            <a href="https://docs.nerior.store" className="public-inline-link">
              Перейти в docs
            </a>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">api.nerior.store</span>
            <h2>API</h2>
            <p>Отдельный авторизованный кабинет ключей и доступов для продуктов Nerior.</p>
            <a href="https://api.nerior.store" className="public-inline-link">
              Открыть API
            </a>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">community.nerior.store</span>
            <h2>Сообщество</h2>
            <p>Публичная зона обсуждений, материалов и обновлений для внешней аудитории.</p>
            <a href="https://community.nerior.store" className="public-inline-link">
              Открыть сообщество
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
