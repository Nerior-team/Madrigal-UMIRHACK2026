export function PublicBusinessPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Бизнес</span>
            <h1>Для команд, которым нужна аккуратная операционная поверхность.</h1>
          </div>
        </div>
        <div className="public-stack-grid">
          <article className="public-story-card">
            <h2>Раздельные сервисные зоны</h2>
            <p>
              Публичный сайт, продукт, документация, API и support не смешиваются в один интерфейс.
            </p>
          </article>
          <article className="public-story-card">
            <h2>Подготовка под линейку продуктов</h2>
            <p>
              Crossplat активен сейчас. Smart-Planner и Karpik встроены в архитектуру заранее.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
