const DEVELOPER_SURFACES = [
  {
    host: "docs.nerior.store",
    title: "Документация",
    body: "Публичная техническая документация с разделением по продуктам, сценариям, reference-материалам и практическим руководствам.",
    href: "https://docs.nerior.store",
    cta: "Перейти в docs",
  },
  {
    host: "api.nerior.store",
    title: "API",
    body: "Отдельный кабинет API-ключей, scopes и аналитики доступа. Авторизация здесь отделена от продуктового входа.",
    href: "https://api.nerior.store",
    cta: "Открыть API",
  },
  {
    host: "community.nerior.store",
    title: "Сообщество",
    body: "Публичная зона анонсов, обсуждений и переходов к связанным слоям: docs, help и обновлениям.",
    href: "https://community.nerior.store",
    cta: "Открыть сообщество",
  },
];

export function PublicDevelopersPage() {
  return (
    <main className="public-page public-page--developers">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Разработчикам</span>
            <h1>Документация, API и сообщество вынесены в отдельные пространства.</h1>
            <p>
              У Nerior отдельный публичный docs-site, отдельный авторизованный API cabinet и отдельная зона
              сообщества. Эти поверхности не смешиваются с рабочим продуктом и не теряются внутри corporate-сайта.
            </p>
          </div>
        </div>

        <div className="public-stack-grid">
          {DEVELOPER_SURFACES.map((surface) => (
            <article key={surface.host} className="public-story-card">
              <span className="public-eyebrow">{surface.host}</span>
              <h2>{surface.title}</h2>
              <p>{surface.body}</p>
              <a href={surface.href} className="public-inline-link">
                {surface.cta}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
