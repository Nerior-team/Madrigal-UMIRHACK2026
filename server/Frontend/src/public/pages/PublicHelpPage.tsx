import { HELP_GROUPS, HELP_PILLARS, HELP_SECTIONS } from "../site-content";

const HELP_LINKS = [
  {
    eyebrow: "Связаться с нами",
    title: "Маршрут в форму обратной связи",
    body: "Здесь должно быть описание того, когда вопрос нужно вести в форму связи, а не оставлять внутри справочного центра.",
    href: "https://nerior.store/contact",
    linkLabel: "Открыть форму",
  },
  {
    eyebrow: "Документация",
    title: "Глубокие технические материалы",
    body: "Здесь должно быть описание того, какие проблемы закрываются справкой, а какие уводятся в docs.",
    href: "https://docs.nerior.store",
    linkLabel: "Перейти в docs",
  },
  {
    eyebrow: "Сообщество",
    title: "Открытые обсуждения и публикации",
    body: "Здесь должно быть описание того, какие темы логичнее направлять в сообщество и публичные материалы.",
    href: "https://community.nerior.store",
    linkLabel: "Открыть community",
  },
] as const;

export function PublicHelpPage() {
  return (
    <main className="public-page public-page--help">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">help.nerior.store</span>
            <h1>Справочный центр</h1>
            <p>
              Публичная справочная поверхность для новых пользователей, команд и точек эскалации. Макет уже готов под FAQ,
              пошаговые инструкции, маршруты диагностики и переходы в соседние сервисы.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          {HELP_PILLARS.map((item) => (
            <article key={item.title} className="public-feature-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Категории</span>
            <h2>Справка уже разделена по типам аудитории и сценариям обращения.</h2>
          </div>
        </div>

        <div className="public-library-grid">
          {HELP_GROUPS.map((group) => (
            <article key={group.title} className="public-story-card">
              <span className="public-eyebrow">Группа</span>
              <h2>{group.title}</h2>
              <ul className="public-card-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Маршруты</span>
            <h2>У каждого запроса есть понятное продолжение: docs, community или прямой контакт.</h2>
          </div>
        </div>

        <div className="public-link-grid">
          {HELP_LINKS.map((item) => (
            <article key={item.title} className="public-story-card">
              <span className="public-eyebrow">{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <div className="public-story-card__links">
                <a href={item.href} className="public-inline-link">
                  {item.linkLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Разделы</span>
            <h2>Готовые блоки под будущие статьи, ответы, диагностику и FAQ-материалы.</h2>
          </div>
        </div>

        <div className="public-stack-grid">
          {HELP_SECTIONS.map((section) => (
            <article key={section.title} className="public-story-card">
              <span className="public-eyebrow">Маршрут</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
