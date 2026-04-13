export function PublicBusinessPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Бизнес</span>
            <h1>Для команд, которым важны управляемость, ясная архитектура и чистые сервисные зоны.</h1>
            <p>
              Nerior разделяет корпоративную витрину, продуктовые интерфейсы, документацию, API и
              support так, чтобы каждая поверхность решала свою задачу.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card">
            <h2>Раздельные домены</h2>
            <p>
              Основной сайт, продукты и инфраструктурные сервисы живут на отдельных поддоменах без
              смешивания сценариев.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Продуктовая линейка</h2>
            <p>
              Crossplat активен сейчас. Smart-Planner и Karpik уже заложены в структуру и появятся
              без пересборки общей витрины.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Поверхности для ролей</h2>
            <p>
              Пользовательские, developer и support-сценарии вынесены в отдельные пространства с
              собственной навигацией и логикой.
            </p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <h2>Операционная дисциплина</h2>
            <p>
              Здесь должно быть описание того, как Nerior строит управляемую среду для команд,
              сервисов и внедрений.
            </p>
          </article>
          <article className="public-story-card">
            <h2>Внедрение и сопровождение</h2>
            <p>
              Здесь должно быть описание этапов внедрения, проектного сопровождения и интеграции с
              внутренней инфраструктурой клиента.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
