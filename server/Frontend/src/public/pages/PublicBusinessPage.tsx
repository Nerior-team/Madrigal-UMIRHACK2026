export function PublicBusinessPage() {
  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Бизнес</span>
            <h1>Для команд, которым нужна управляемая инфраструктура, а не перегруженный общий интерфейс.</h1>
            <p>
              Nerior разводит корпоративную витрину, продуктовые интерфейсы, документацию, API и поддержку по
              отдельным поверхностям, чтобы каждая из них могла быть ясной, чистой и пригодной для ежедневной
              работы.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card">
            <h2>Отдельные домены</h2>
            <p>
              Основной сайт, продуктовые зоны, docs, API и support-контур живут на отдельных поддоменах и не
              мешают друг другу на уровне UX и пользовательских сценариев.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Продуктовый контур</h2>
            <p>
              Crossplat уже работает как отдельный продукт. Smart-Planner и Karpik заложены в структуру и могут
              быть включены позже без переделки всей публичной витрины.
            </p>
          </article>
          <article className="public-feature-card">
            <h2>Поверхности по ролям</h2>
            <p>
              Пользовательские, developer и support-сценарии разделены: у каждой поверхности свой контекст, свой
              маршрут входа и свой набор действий.
            </p>
          </article>
        </div>

        <div className="public-stack-grid">
          <article className="public-story-card">
            <span className="public-eyebrow">Операционный контур</span>
            <h2>Среда, которую можно показывать клиенту, команде и партнёрам без оговорок.</h2>
            <p>
              Корпоративная витрина, рабочий продукт, API и support-слой собраны в одну систему, но не смешаны
              между собой. Это позволяет масштабировать сервис без визуального и смыслового шума.
            </p>
          </article>
          <article className="public-story-card">
            <span className="public-eyebrow">Внедрение</span>
            <h2>Переход от презентации к реальному использованию без второй архитектуры.</h2>
            <p>
              Бизнес-сайт ведёт не в абстрактный лендинг, а в готовые рабочие поверхности: продукт, документацию,
              API-кабинет и контактный канал для обсуждения внедрения.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
