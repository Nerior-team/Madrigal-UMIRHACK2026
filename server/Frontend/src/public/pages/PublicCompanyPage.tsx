const COMPANY_SECTIONS = [
  {
    id: "about",
    label: "О нас",
    title: "О компании",
    paragraphs: [
      "Nerior - это компания, которая строит экосистему из нескольких цифровых сервисов и продуктов, разделяя корпоративную витрину, продуктовые интерфейсы, документацию, API и support-зоны так, чтобы каждая поверхность решала свою задачу без перегруза.",
      "Мы не строим монолитный продукт - мы строим инфраструктуру, в которой каждый слой независим и отвечает за свою область: Crossplat управляет машинами и задачами, API-кабинет - ключами доступа, документация - структурированными знаниями, сообщество - открытым взаимодействием.",
      "Такой подход позволяет каждой зоне развиваться в своём темпе, с нужным уровнем доступа и собственной аудиторией.",
    ],
  },
  {
    id: "careers",
    label: "Карьера",
    title: "Команда, которая строит инфраструктуру",
    paragraphs: [
      "Мы ищем людей, которые умеют думать о системах, а не только о функциях. Каждая роль в Nerior связана с конкретной зоной ответственности: продуктовой, инфраструктурной, клиентской или аналитической.",
      "Мы не нанимаем под временные задачи - мы строим команду для долгосрочного роста. Ожидаем самостоятельности в принятии решений, понимания контекста продукта и умения работать с неопределённостью.",
    ],
    roles: [
      { role: "Фронтенд-разработчик", area: "Продуктовые интерфейсы" },
      { role: "Бэкенд-инженер", area: "API и инфраструктура" },
      { role: "Технический писатель", area: "Документация и руководства" },
    ],
  },
  {
    id: "stories",
    label: "Истории",
    title: "Разборы, кейсы и внутренние истории",
    paragraphs: [
      "Здесь будут публиковаться материалы о том, как развивались продукты Nerior: технические решения, продуктовые разборы, внутренние истории и демонстрационные примеры внедрений.",
      "Это не маркетинговые кейсы в традиционном смысле - скорее документация решений, принятых в реальных условиях.",
    ],
    footer: "Первые публикации появятся по мере накопления внешнего опыта использования продуктов.",
  },
];

export function PublicCompanyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 1.75rem 3rem" }}>
        <p style={eyebrowStyle}>Компания</p>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            marginBottom: "1.25rem",
          }}
        >
          Nerior
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: "580px" }}>
          Экосистема цифровых сервисов и продуктов с чётко разделёнными зонами ответственности.
        </p>
      </section>

      <div style={dividerStyle} />

      {COMPANY_SECTIONS.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: index === COMPANY_SECTIONS.length - 1 ? "4.5rem 1.75rem 7rem" : "4.5rem 1.75rem",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "3rem", alignItems: "start" }}>
            <div>
              <p
                style={{
                  ...eyebrowStyle,
                  position: "sticky",
                  top: "calc(var(--n-nav-h) + 1.5rem)",
                  marginBottom: 0,
                }}
              >
                {section.label}
              </p>
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  marginBottom: "1.25rem",
                  color: "#fff",
                }}
              >
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  style={{
                    fontSize: "1rem",
                    color: "rgba(255,255,255,0.58)",
                    lineHeight: 1.7,
                    marginBottom: "1.25rem",
                  }}
                >
                  {paragraph}
                </p>
              ))}
              {"roles" in section && section.roles ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
                  {section.roles.map((roleItem) => (
                    <div
                      key={roleItem.role}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: "0.9375rem", color: "#fff" }}>{roleItem.role}</span>
                      <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>{roleItem.area}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {"footer" in section && section.footer ? (
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>{section.footer}</p>
              ) : null}
            </div>
          </div>
          {index < COMPANY_SECTIONS.length - 1 ? <div style={{ ...dividerStyle, margin: "4.5rem 0 0" }} /> : null}
        </section>
      ))}
    </main>
  );
}

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "0 1.75rem",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "1.5rem",
};
