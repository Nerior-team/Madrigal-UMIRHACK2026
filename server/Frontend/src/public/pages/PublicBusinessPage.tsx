import { Link } from "react-router-dom";

const ARCHITECTURE_ITEMS = [
  {
    label: "Корпоративная витрина",
    host: "nerior.store",
    desc: "Публичная точка входа в экосистему. Описание компании, продуктов, обновлений и форма контакта.",
  },
  {
    label: "Продуктовые интерфейсы",
    host: "crossplat / smart-planner / karpik",
    desc: "Каждый продукт работает на отдельном хосте с собственным UI и независимой сессией.",
  },
  {
    label: "Документация",
    host: "docs.nerior.store",
    desc: "Структурированная база знаний с разбивкой по продуктам, API-маршрутам и практическим сценариям.",
  },
  {
    label: "API-кабинет",
    host: "api.nerior.store",
    desc: "Защищённая зона управления ключами. Мультипродуктовая структура и аналитика использования.",
  },
  {
    label: "Поддержка и сообщество",
    host: "help / community",
    desc: "Справочный центр с маршрутизацией по аудиториям и открытая зона для обсуждений.",
  },
];

const PRODUCTS = [
  { name: "Crossplat", status: "Доступен", desc: "Управление агентами, машинами, задачами и результатами. API открыт для внешней интеграции." },
  { name: "Smart-Planner", status: "Скоро", desc: "Интеллектуальный планировщик задач и ресурсов для командной работы." },
  { name: "Karpik", status: "Скоро", desc: "Аналитика и мониторинг с подключением к событийным потокам и операционным данным." },
];

const OPERATIONS = [
  {
    title: "Изолированные сессии",
    desc: "Авторизация на каждом хосте независима. Crossplat и API-кабинет используют разные cookie.",
  },
  {
    title: "Ключи с ограниченным доступом",
    desc: "API-ключи выдаются на конкретный продукт и scope. Управление идёт через api.nerior.store.",
  },
  {
    title: "Обработка заявок",
    desc: "Входящие заявки из формы контакта маршрутизируются дальше по рабочему каналу без ручной перепаковки.",
  },
];

export function PublicBusinessPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 1.75rem 4rem" }}>
        <p style={eyebrowStyle}>Бизнес</p>
        <h1 style={heroTitleStyle}>Раздельные сервисные поверхности для каждой задачи</h1>
        <p style={heroBodyStyle}>
          Nerior строит экосистему, в которой каждая поверхность решает одну задачу без перегруза. Корпоративная витрина,
          продуктовые интерфейсы, документация, API и зоны поддержки разделены по хостам и ролям.
        </p>
        <Link to="/contact" style={primaryLinkStyle}>
          Связаться с отделом продаж
        </Link>
      </section>

      <div style={dividerStyle} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4.5rem 1.75rem" }}>
        <p style={eyebrowStyle}>Сервисная архитектура</p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ARCHITECTURE_ITEMS.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                gap: "2rem",
                padding: "1.75rem 0",
                borderBottom: index < ARCHITECTURE_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                alignItems: "start",
              }}
            >
              <div>
                <h3 style={sectionTitleStyle}>{item.label}</h3>
                <code style={hostCodeStyle}>{item.host}</code>
              </div>
              <p style={sectionBodyStyle}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={dividerStyle} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4.5rem 1.75rem" }}>
        <p style={eyebrowStyle}>Продуктовая линейка</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {PRODUCTS.map((product, index) => (
            <div
              key={product.name}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: "2rem",
                padding: "1.75rem 0",
                borderBottom: index < PRODUCTS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                alignItems: "start",
                opacity: product.status === "Доступен" ? 1 : 0.5,
              }}
            >
              <div>
                <h3 style={{ ...sectionTitleStyle, fontSize: "1.125rem" }}>{product.name}</h3>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: product.status === "Доступен" ? "#b5f542" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {product.status}
                </span>
              </div>
              <p style={sectionBodyStyle}>{product.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={dividerStyle} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "4.5rem 1.75rem 7rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>
          <div>
            <p style={eyebrowStyle}>Операционная дисциплина</p>
            <h2 style={subsectionTitleStyle}>Внедрение и сопровождение</h2>
            <p style={sectionBodyStyle}>
              Каждая зона инфраструктуры изолирована по ответственности. Продуктовые сессии не смешиваются, а доступ к
              интеграциям вынесен в отдельный кабинет.
            </p>
            <p style={sectionBodyStyle}>
              API-кабинет выдаёт ключи с ограниченными scopes и временем жизни, а документация и support-слои живут отдельно от
              продуктового интерфейса.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {OPERATIONS.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "1.25rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.375rem",
                }}
              >
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", marginBottom: "0.4rem" }}>{item.title}</h4>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
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

const heroTitleStyle: React.CSSProperties = {
  fontSize: "clamp(2rem, 5vw, 3.75rem)",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  marginBottom: "1.5rem",
  maxWidth: "700px",
};

const heroBodyStyle: React.CSSProperties = {
  fontSize: "1.0625rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.65,
  maxWidth: "600px",
  marginBottom: "2.5rem",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "#fff",
  marginBottom: "0.35rem",
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: "clamp(1.5rem, 3vw, 2rem)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  marginBottom: "1.25rem",
};

const sectionBodyStyle: React.CSSProperties = {
  fontSize: "0.9375rem",
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.65,
  marginBottom: "1.25rem",
};

const hostCodeStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.3)",
  fontFamily: "monospace",
};

const primaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.625rem 1.5rem",
  background: "#fff",
  color: "#000",
  borderRadius: "999px",
  fontWeight: 600,
  fontSize: "0.875rem",
  textDecoration: "none",
};
