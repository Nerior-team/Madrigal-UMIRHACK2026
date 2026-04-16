import { Link } from "react-router-dom";
import { NERIOR_METRICS, PRODUCT_ITEMS } from "../site-content";

const API_ROUTES = [
  { code: "GET /api/v1/external/machines", label: "Список машин" },
  { code: "POST /api/v1/external/tasks", label: "Создать задачу" },
  { code: "GET /api/v1/external/results/{id}/export/json", label: "Экспорт результата" },
];

export function NeriorHomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "8rem 1.75rem 6rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "2rem",
          }}
        >
          Nerior - экосистема цифровых сервисов
        </p>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "0 0 2.25rem",
            maxWidth: "780px",
          }}
        >
          Инфраструктура для продуктов, которые работают
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.6,
            maxWidth: "580px",
            marginBottom: "2.75rem",
          }}
        >
          Nerior строит раздельные сервисные поверхности - корпоративный сайт, продуктовые интерфейсы, документацию, API и зоны
          поддержки - так, чтобы каждая решала свою задачу без перегруза.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="https://crossplat.nerior.store"
            target="_blank"
            rel="noopener noreferrer"
            style={{
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
            }}
          >
            Открыть Crossplat <span style={{ fontSize: "0.75rem" }}>-&gt;</span>
          </a>
          <a
            href="https://docs.nerior.store"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.625rem 1.5rem",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Документация <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>&gt;</span>
          </a>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.75rem" }} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 1.75rem 1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {NERIOR_METRICS.map((item) => (
            <article
              key={item.label}
              style={{
                padding: "1.5rem",
                background: "#000",
                minHeight: "128px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>{item.label}</span>
              <strong
                style={{
                  fontSize: item.label === "Фокус" ? "1.25rem" : "1.75rem",
                  color: "#fff",
                  letterSpacing: item.label === "Фокус" ? "-0.02em" : "-0.04em",
                  lineHeight: 1.05,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {item.value}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section id="products" style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 1.75rem" }}>
        <p
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "2.5rem",
          }}
        >
          Продуктовая линейка
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {PRODUCT_ITEMS.map((product) => (
            <article
              key={product.name}
              style={{
                padding: "2rem",
                background: "#000",
                opacity: product.status === "active" ? 1 : 0.4,
              }}
            >
              <p
                style={{
                  fontSize: "0.6875rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "0.75rem",
                }}
              >
                {product.status === "active" ? "Активен" : "Не доступно в данный момент"}
              </p>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>{product.name}</h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.55,
                  marginBottom: product.status === "active" ? "1.5rem" : 0,
                }}
              >
                {product.description}
              </p>
              {product.status === "active" ? (
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "#fff", textDecoration: "none" }}
                >
                  Открыть <span>-&gt;</span>
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.75rem" }} />

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 1.75rem" }}>
        <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px" }}>
            <p
              style={{
                fontSize: "0.6875rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "1.5rem",
              }}
            >
              Разработчикам
            </p>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                marginBottom: "1.25rem",
              }}
            >
              Внешний API и документация
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
                marginBottom: "1.75rem",
              }}
            >
              API-кабинет на <code style={codeStyle}>api.nerior.store</code> даёт доступ к машинам, задачам и результатам.
              Документация и руководства живут на <code style={codeStyle}>docs.nerior.store</code>.
            </p>
            <Link
              to="/developers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.6)",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: "2px",
                textDecoration: "none",
              }}
            >
              Подробнее для разработчиков
            </Link>
          </div>
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "3.25rem" }}>
            {API_ROUTES.map((route) => (
              <div
                key={route.code}
                style={{
                  padding: "0.875rem 1rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "0.375rem",
                }}
              >
                <code style={{ fontSize: "0.75rem", color: "#b5f542", display: "block", marginBottom: "0.25rem" }}>{route.code}</code>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{route.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.75rem" }} />

      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "5rem 1.75rem 7rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Готовы начать?
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: "480px", lineHeight: 1.6 }}>
          Оставьте заявку или попробуйте Crossplat прямо сейчас.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href="https://crossplat.nerior.store"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.625rem 1.5rem",
              background: "#fff",
              color: "#000",
              borderRadius: "999px",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Попробовать бесплатно -&gt;
          </a>
          <Link
            to="/contact"
            style={{
              padding: "0.625rem 1.5rem",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Связаться с нами
          </Link>
        </div>
      </section>
    </main>
  );
}

const codeStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.07)",
  padding: "0.1em 0.3em",
  borderRadius: "3px",
  fontSize: "0.875em",
};
