import { HELP_GROUPS, HELP_SECTIONS } from "../site-content";
import { PublicSubnav } from "../components/PublicSubnav";

const HELP_LINKS = [
  { label: "Первый вход", href: "/#entry" },
  { label: "Аккаунт и доступ", href: "/#account" },
  { label: "Crossplat", href: "/#crossplat" },
  { label: "API", href: "/#api" },
];

const NEXT_STEPS = [
  {
    eyebrow: "Связаться с нами",
    title: "Форма обратной связи",
    body: "Если вопрос нельзя закрыть через help и docs, основной маршрут ведёт в форму связи на корпоративном сайте.",
    href: "https://nerior.store/contact",
    linkLabel: "Открыть форму",
  },
  {
    eyebrow: "Документация",
    title: "Глубокие технические материалы",
    body: "Технические инструкции, reference и продуктовые материалы живут в docs. Help остаётся быстрым маршрутом входа и поддержки.",
    href: "https://docs.nerior.store",
    linkLabel: "Перейти в docs",
  },
  {
    eyebrow: "Сообщество",
    title: "Открытые обсуждения и публикации",
    body: "Community и updates отвечают за анонсы и внешний контентный поток. Help не превращается в публичный журнал.",
    href: "https://community.nerior.store",
    linkLabel: "Открыть community",
  },
];

export function PublicHelpPage() {
  return (
    <>
      <PublicSubnav brand="Справочный центр" brandHref="/" links={HELP_LINKS} />

      <main style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingTop: "var(--n-nav-h)" }}>
        <section style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 1.75rem 3.5rem" }}>
          <p style={eyebrowStyle}>help.nerior.store</p>
          <h1 style={heroTitleStyle}>Справочный центр</h1>
          <p style={heroBodyStyle}>
            Публичная справочная поверхность для новых пользователей, команд и support-маршрутов. Здесь собраны быстрые ответы,
            пути диагностики и переходы в связанные сервисы.
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.75rem" }} />

        {HELP_SECTIONS.map((section, index) => {
          const id =
            index === 0 ? "entry" : index === 1 ? "account" : index === 2 ? "crossplat" : index === 3 ? "api" : `section-${index}`;

          return (
            <section
              key={section.title}
              id={id}
              style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: "4rem 1.75rem",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }}>
                <h2 style={sectionTitleStyle}>{section.title}</h2>
                <p style={leadParagraphStyle}>{section.body}</p>
              </div>
            </section>
          );
        })}

        <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }}>
            <h2 style={sectionTitleStyle}>Категории</h2>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {HELP_GROUPS.map((group) => (
                <article
                  key={group.title}
                  style={{
                    padding: "1.5rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.375rem",
                    display: "grid",
                    gap: "0.9rem",
                  }}
                >
                  <p style={eyebrowStyle}>Группа</p>
                  <h3 style={{ margin: 0, fontSize: "1rem", lineHeight: 1.4 }}>{group.title}</h3>
                  <ul style={listStyle}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 1.75rem 5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }}>
            <h2 style={sectionTitleStyle}>Следующие маршруты</h2>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {NEXT_STEPS.map((item) => (
                <article
                  key={item.title}
                  style={{
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    display: "grid",
                    gap: "0.55rem",
                  }}
                >
                  <p style={eyebrowStyle}>{item.eyebrow}</p>
                  <h3 style={{ margin: 0, fontSize: "1rem", lineHeight: 1.4 }}>{item.title}</h3>
                  <p style={paragraphStyle}>{item.body}</p>
                  <a href={item.href} style={inlineLinkStyle}>
                    {item.linkLabel} -&gt;
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const eyebrowStyle = {
  fontSize: "0.6875rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: "1rem",
} as const;

const heroTitleStyle = {
  fontSize: "clamp(2rem, 5vw, 3.5rem)",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  marginBottom: "1.25rem",
} as const;

const heroBodyStyle = {
  fontSize: "1.0625rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.65,
  maxWidth: "560px",
} as const;

const sectionTitleStyle = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  margin: 0,
  lineHeight: 1.4,
} as const;

const leadParagraphStyle = {
  fontSize: "0.9375rem",
  color: "rgba(255,255,255,0.7)",
  lineHeight: 1.7,
  margin: 0,
} as const;

const paragraphStyle = {
  fontSize: "0.9375rem",
  color: "rgba(255,255,255,0.45)",
  lineHeight: 1.7,
  margin: 0,
} as const;

const inlineLinkStyle = {
  fontSize: "0.875rem",
  color: "rgba(255,255,255,0.5)",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  paddingBottom: "1px",
  textDecoration: "none",
  width: "fit-content",
} as const;

const listStyle = {
  margin: 0,
  paddingLeft: "1rem",
  display: "grid",
  gap: "0.5rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.6,
} as const;
