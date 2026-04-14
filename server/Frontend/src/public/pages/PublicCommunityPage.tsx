import { COMMUNITY_CHANNELS, COMMUNITY_PILLARS, COMMUNITY_SECTIONS } from "../site-content";

const COMMUNITY_LINKS = [
  {
    eyebrow: "Обновления",
    title: "Публикации и анонсы",
    body: "Лента обновлений остаётся на nerior.store/updates, а community использует её как внешний контентный поток.",
    href: "https://nerior.store/updates",
    linkLabel: "Открыть обновления",
  },
  {
    eyebrow: "Документация",
    title: "Материалы для разработчиков",
    body: "Технические материалы и справочные тексты уводятся в docs.nerior.store, а не смешиваются с обсуждениями.",
    href: "https://docs.nerior.store",
    linkLabel: "Перейти в docs",
  },
  {
    eyebrow: "Справка",
    title: "Вопросы и помощь",
    body: "Help center остаётся отдельной публичной зоной для быстрых ответов, маршрутов поддержки и self-service сценариев.",
    href: "https://help.nerior.store",
    linkLabel: "Открыть help",
  },
] as const;

export function PublicCommunityPage() {
  return (
    <main className="public-page public-page--community">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">community.nerior.store</span>
            <h1>Сообщество Nerior</h1>
            <p>
              Публичная зона для анонсов, обсуждений, связанных материалов и внешних точек контакта. Она не
              заменяет docs и help, а связывает их между собой.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          {COMMUNITY_PILLARS.map((item) => (
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
            <span className="public-eyebrow">Каналы</span>
            <h2>Публичные направления: что читают, где обсуждают и куда переходят дальше.</h2>
          </div>
        </div>

        <div className="public-link-grid">
          {COMMUNITY_CHANNELS.map((channel) => (
            <article key={channel.title} className="public-story-card">
              <span className="public-eyebrow">Канал</span>
              <h2>{channel.title}</h2>
              <p>{channel.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Связанные поверхности</span>
            <h2>Community связано с публикациями, документацией и публичной поддержкой.</h2>
          </div>
        </div>

        <div className="public-link-grid">
          {COMMUNITY_LINKS.map((item) => (
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
            <span className="public-eyebrow">Структура разделов</span>
            <h2>Готовые контейнеры под будущие программы, открытые архивы и редакционные циклы.</h2>
          </div>
        </div>

        <div className="public-stack-grid">
          {COMMUNITY_SECTIONS.map((section) => (
            <article key={section.title} className="public-story-card">
              <span className="public-eyebrow">Раздел</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
