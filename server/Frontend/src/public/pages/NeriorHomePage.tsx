import { ArrowUpRight } from "lucide-react";
import { NERIOR_METRICS, PRODUCT_ITEMS } from "../site-content";

export function NeriorHomePage() {
  return (
    <main className="public-page public-page--site">
      <section className="public-hero public-hero--site">
        <div className="public-hero__copy">
          <span className="public-eyebrow">Nerior</span>
          <h1>Системы, продукты и инфраструктурные сервисы в одном контуре.</h1>
          <p>
            Единая компания, отдельные продукты и отдельные рабочие поверхности для пользователей,
            разработчиков и поддержки.
          </p>
          <div className="public-hero__actions">
            <a href="https://crossplat.nerior.store" className="public-button public-button--solid">
              Открыть Crossplat
            </a>
            <a href="/contact" className="public-button public-button--ghost">
              Связаться с нами
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
          <span className="public-eyebrow">Продукты</span>
          <h2>Каждый продукт живёт на своём поддомене.</h2>
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
          <h2>Контур для команд, которым важны управляемость и аккуратная операционная среда.</h2>
          <p>
            Публичная корпоративная поверхность, отдельные продукты, отдельные сервисные зоны и
            чистая структура под будущий рост.
          </p>
          <a href="/business" className="public-inline-link">
            Перейти в раздел
          </a>
        </article>
        <article className="public-story-card">
          <span className="public-eyebrow">Разработчикам</span>
          <h2>Документация, API и сообщество вынесены в отдельные пространства.</h2>
          <p>
            Пользовательский сайт, документы, API-кабинет, help center и community больше не
            смешиваются в один интерфейс.
          </p>
          <div className="public-story-card__links">
            <a href="https://docs.nerior.store" className="public-inline-link">
              Документация
            </a>
            <a href="https://api.nerior.store" className="public-inline-link">
              API
            </a>
            <a href="https://community.nerior.store" className="public-inline-link">
              Сообщество
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
