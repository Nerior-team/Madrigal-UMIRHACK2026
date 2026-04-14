import { ArrowUpRight } from "lucide-react";
import { NERIOR_METRICS, PRODUCT_ITEMS } from "../site-content";

const API_ROUTES = [
  { code: "GET /api/v1/external/machines", label: "Список машин" },
  { code: "POST /api/v1/external/tasks", label: "Создать задачу" },
  { code: "GET /api/v1/external/results/{id}/export/json", label: "Экспорт результата" },
];

export function NeriorHomePage() {
  return (
    <main className="public-page public-page--site">
      <section className="public-hero public-hero--site">
        <div className="public-hero__copy">
          <span className="public-eyebrow">Nerior</span>
          <h1>Инфраструктура для продуктов, которые работают.</h1>
          <p>
            Nerior собирает корпоративный сайт, продуктовые интерфейсы, документацию, API и support-контур в
            одну экосистему, где каждая поверхность отвечает за свою задачу и не перегружает остальные.
          </p>
          <div className="public-hero__actions">
            <a href="https://crossplat.nerior.store" className="public-button public-button--solid">
              Открыть Crossplat
            </a>
            <a href="https://docs.nerior.store" className="public-button public-button--ghost">
              Документация
            </a>
          </div>
        </div>

        <div className="public-metrics-grid">
          {NERIOR_METRICS.map((item) => (
            <article key={item.label} className="public-metric-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="products" className="public-section public-section--products">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Продукты</span>
            <h2>Каждый продукт живёт на своём поддомене и не смешивается с соседними сценариями.</h2>
          </div>
        </div>
        <div className="public-product-grid">
          {PRODUCT_ITEMS.map((product) => (
            <article
              key={product.name}
              className={
                product.status === "active"
                  ? "public-product-card"
                  : "public-product-card public-product-card--disabled"
              }
            >
              <div>
                <span className="public-product-card__status">
                  {product.status === "active" ? "Доступно" : "Не доступно в данный момент"}
                </span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
              {product.status === "active" ? (
                <a href={product.href} className="public-inline-link">
                  Открыть <ArrowUpRight size={16} />
                </a>
              ) : (
                <span className="public-inline-link public-inline-link--muted">Скоро</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section--two-up">
        <article className="public-story-card">
          <span className="public-eyebrow">Бизнес</span>
          <h2>Разделённый контур для команд, которым важны управляемость и ясная архитектура.</h2>
          <p>
            Основной сайт, рабочий продукт, документация, API и support вынесены в отдельные поверхности, чтобы
            пользователю, команде и разработчику не приходилось работать в одном перегруженном интерфейсе.
          </p>
          <a href="/business" className="public-inline-link">
            Перейти в раздел
          </a>
        </article>

        <article className="public-story-card">
          <span className="public-eyebrow">Разработчикам</span>
          <h2>Документация, API и сообщество вынесены в отдельные пространства с собственной навигацией.</h2>
          <p>
            Docs, API cabinet и community больше не прячутся внутри продукта. У каждого слоя свой контекст, свои
            маршруты и своя задача.
          </p>
          <div className="public-story-card__links">
            <a href="https://docs.nerior.store" className="public-inline-link">
              Docs
            </a>
            <a href="https://api.nerior.store" className="public-inline-link">
              API
            </a>
            <a href="https://community.nerior.store" className="public-inline-link">
              Community
            </a>
          </div>
        </article>
      </section>

      <section className="public-section public-section--two-up">
        <article className="public-story-card">
          <span className="public-eyebrow">Внешний API</span>
          <h2>API-слой уже разделён по маршрутам и готов для отдельных ключей доступа.</h2>
          <p>
            Для интеграций используется отдельный кабинет на api.nerior.store, а документация по внешним маршрутам
            и сценариям доступа вынесена в docs.nerior.store.
          </p>
          <a href="https://api.nerior.store" className="public-inline-link">
            Открыть API cabinet
          </a>
        </article>

        <div className="public-route-stack">
          {API_ROUTES.map((route) => (
            <article key={route.code} className="public-route-card">
              <code>{route.code}</code>
              <span>{route.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <article className="public-cta-strip">
          <div>
            <span className="public-eyebrow">Следующий шаг</span>
            <h2>Попробуйте Crossplat или свяжитесь с нами по продукту, внедрению и интеграции.</h2>
            <p>
              Публичный сайт ведёт в рабочий продукт, документацию и форму связи без лишних промежуточных слоёв.
            </p>
          </div>
          <div className="public-story-card__links">
            <a href="https://crossplat.nerior.store" className="public-button public-button--solid">
              Попробовать бесплатно
            </a>
            <a href="/contact" className="public-button public-button--ghost">
              Связаться с нами
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
