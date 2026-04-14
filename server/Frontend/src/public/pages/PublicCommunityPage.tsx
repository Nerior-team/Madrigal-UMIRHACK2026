import { COMMUNITY_CHANNELS, COMMUNITY_PILLARS, COMMUNITY_SECTIONS } from "../site-content";

const COMMUNITY_LINKS = [
  {
    eyebrow: "Обновления",
    title: "Публикации и анонсы",
    body: "Здесь должно быть описание того, как обновления, статьи и анонсы попадают в публичную ленту Nerior.",
    href: "https://nerior.store/updates",
    linkLabel: "Открыть обновления",
  },
  {
    eyebrow: "Документация",
    title: "Материалы для разработчиков",
    body: "Здесь должно быть описание переходов к документации, руководствам и связанным техническим материалам.",
    href: "https://docs.nerior.store",
    linkLabel: "Перейти в docs",
  },
  {
    eyebrow: "Справка",
    title: "Вопросы и помощь",
    body: "Здесь должно быть описание того, как сообщество и справочный центр дополняют друг друга.",
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
              Публичное пространство для анонсов, обсуждений, открытых материалов и внешних точек контакта. Здесь уже готова
              структура, в которую можно добавлять реальные публикации, каналы и события без смены макета.
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
            <h2>Ключевые публичные направления: что читают, где общаются и куда возвращаются за новыми материалами.</h2>
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
            <h2>Сообщество связано с публикациями, документацией и публичной поддержкой.</h2>
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
            <h2>Готовые контейнеры под реальные программы, редакционные циклы и открытые архивы.</h2>
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
