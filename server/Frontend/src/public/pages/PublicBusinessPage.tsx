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
              support так, чтобы каждая поверхность решала свою задачу без перегрузки.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card">
            <h2>Раздельные домены</h2>
            <p>
              Основной сайт, продукты и инфраструктурные сервисы живут на отдельных поддоменах без
              смешивания пользовательских сценариев.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Продуктовая линейка</h2>
            <p>
              Crossplat активен уже сейчас. Smart planner и Karpik уже заложены в структуру и
              смогут включаться без пересборки всей публичной витрины.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Поверхности по ролям</h2>
            <p>
              Пользовательские, developer и support-сценарии разведены по разным поверхностям со
              своей навигацией, контекстом и уровнем доступа.
            </p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <span className="public-eyebrow">Операционная дисциплина</span>
            <h2>Контур, который можно показывать клиенту и команде.</h2>
            <p>
              Здесь должно быть описание того, как Nerior строит управляемую среду для команд,
              сервисов, внедрений и ежедневных операционных процессов.
            </p>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">Внедрение</span>
            <h2>Переход от презентации к рабочему контуру.</h2>
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
