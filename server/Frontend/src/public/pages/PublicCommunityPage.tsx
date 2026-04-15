import { PublicSubnav } from "../components/PublicSubnav";

const COMMUNITY_LINKS = [
  { label: "Обновления", href: "/#updates" },
  { label: "Обсуждения", href: "/#discussions" },
  { label: "Материалы", href: "/#materials" },
  { label: "Каналы", href: "/#channels" },
];

const SECTIONS = [
  {
    id: "updates",
    title: "Обновления сообщества",
    body: [
      "Здесь публикуются анонсы, публичные заметки, релизные сообщения и новости для внешней аудитории. Каждое обновление фиксируется и архивируется, а лента остаётся единым публичным потоком.",
      "Список обновлений синхронизирован с nerior.store/updates. Там же находятся статьи и публикации, которые потом попадают в общую контентную систему.",
    ],
    links: [{ label: "Перейти к обновлениям", href: "https://nerior.store/updates" }],
  },
  {
    id: "discussions",
    title: "Обсуждения",
    body: [
      "Открытое пространство для взаимодействия пользователей, разработчиков и команды Nerior. Темы включают продуктовые вопросы, интеграции, сценарии использования и предложения по развитию.",
      "Чтение материалов публичное. Дальнейшие форматы участия и модерации можно расширять без изменения общей структуры страницы.",
    ],
  },
  {
    id: "materials",
    title: "Материалы",
    body: [
      "Здесь собираются открытые записи: разборы решений, презентации, подборки материалов и внешние публикации команды. Это не дублирует документацию, а связывает её с публичным контентом.",
      "Технические инструкции и reference остаются в docs.nerior.store, а community показывает контекст, анонсы и входные точки.",
    ],
    links: [{ label: "Документация", href: "https://docs.nerior.store" }],
  },
  {
    id: "channels",
    title: "Каналы",
    body: [
      "Сообщество связано с несколькими публичными поверхностями: публикации идут через nerior.store/updates, форма связи живёт на corporate-сайте, а документация и справка вынесены в отдельные домены.",
      "Каждый канал решает свою задачу и не дублирует другие. Community остаётся местом для открытого контекста и внешнего взаимодействия.",
    ],
    links: [
      { label: "Обновления", href: "https://nerior.store/updates" },
      { label: "Документация", href: "https://docs.nerior.store" },
      { label: "Справочный центр", href: "https://help.nerior.store" },
    ],
  },
];

export function PublicCommunityPage() {
  return (
    <>
      <PublicSubnav brand="Сообщество" brandHref="/" links={COMMUNITY_LINKS} />

      <main style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingTop: "var(--n-nav-h)" }}>
        <section style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 1.75rem 3.5rem" }}>
          <p style={eyebrowStyle}>community.nerior.store</p>
          <h1 style={heroTitleStyle}>Сообщество Nerior</h1>
          <p style={heroBodyStyle}>
            Зона публичных обсуждений, открытых материалов, анонсов и точек взаимодействия с внешней аудиторией.
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.75rem" }} />

        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "4rem 1.75rem",
              borderBottom: index < SECTIONS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }}>
              <h2 style={sectionTitleStyle}>{section.title}</h2>
              <div>
                {section.body.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} style={paragraphIndex === 0 ? leadParagraphStyle : paragraphStyle}>
                    {paragraph}
                  </p>
                ))}

                {section.links ? (
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                    {section.links.map((link) => (
                      <a key={link.href} href={link.href} style={inlineLinkStyle}>
                        {link.label} -&gt;
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

const eyebrowStyle = {
  fontSize: "0.6875rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: "1.25rem",
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
  marginBottom: "0.875rem",
} as const;

const paragraphStyle = {
  fontSize: "0.9375rem",
  color: "rgba(255,255,255,0.45)",
  lineHeight: 1.7,
  marginBottom: "0.875rem",
} as const;

const inlineLinkStyle = {
  fontSize: "0.875rem",
  color: "rgba(255,255,255,0.5)",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  paddingBottom: "1px",
  textDecoration: "none",
} as const;
