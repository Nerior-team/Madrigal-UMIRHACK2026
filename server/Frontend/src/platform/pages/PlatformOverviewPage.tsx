import type { PlatformDashboardData, PlatformApiKeyStats } from "../api/platform";
import { PlatformHero } from "../components/PlatformHero";
import { PlatformSectionCard } from "../components/PlatformSectionCard";
import { PlatformStatCard } from "../components/PlatformStatCard";
import { PLATFORM_PRODUCTS } from "../products";

type PlatformOverviewPageProps = {
  dashboard: PlatformDashboardData;
  stats: PlatformApiKeyStats;
};

export function PlatformOverviewPage({ dashboard, stats }: PlatformOverviewPageProps) {
  const availableProducts = PLATFORM_PRODUCTS.filter((item) => item.status === "available").length;

  return (
    <div className="platform-page platform-page--overview">
      <PlatformHero
        kicker="API доступ"
        title="Управление ключами доступа для сервисов Nerior."
        subtitle="Кабинет отвечает за выпуск ключей, доступные продукты, scope-границы и usage-видимость. Документация вынесена отдельно на docs.nerior.store."
        primaryCtaHref="/keys"
        primaryCtaLabel="Открыть ключи"
        secondaryCtaHref="https://docs.nerior.store"
        secondaryCtaLabel="Открыть docs"
      />

      <section className="platform-stats-grid">
        <PlatformStatCard label="Сервисы" value={String(PLATFORM_PRODUCTS.length)} detail="Продукты, показанные в кабинете" />
        <PlatformStatCard label="Активны" value={String(availableProducts)} detail="Продукты с доступным API прямо сейчас" />
        <PlatformStatCard label="Ключи" value={String(stats.total)} detail="Ключи, связанные с этим аккаунтом" />
        <PlatformStatCard label="Машины" value={String(dashboard.machineOptions.length)} detail="Доступные scope Crossplat" />
        <PlatformStatCard label="Вызовы" value={String(stats.totalUses)} detail="Общее число зафиксированных обращений" />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Продукты"
          title="Доступность сервисов"
          detail="Для новых ключей можно выбирать только сервисы с живыми API-контрактами."
        >
          <div className="platform-product-grid">
            {PLATFORM_PRODUCTS.map((product) => (
              <article
                key={product.key}
                className={
                  product.status === "available"
                    ? "platform-product-card"
                    : "platform-product-card platform-product-card--disabled"
                }
              >
                <div className="platform-product-card__header">
                  <strong>{product.name}</strong>
                  <span
                    className={
                      product.status === "available"
                        ? "platform-badge platform-badge--active"
                        : "platform-badge"
                    }
                  >
                    {product.note}
                  </span>
                </div>
                <p>{product.description}</p>
                {product.href ? (
                  <a className="platform-inline-link" href={product.href}>
                    Открыть продукт
                  </a>
                ) : (
                  <span className="platform-disabled-link">Не доступно</span>
                )}
              </article>
            ))}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Сессия"
          title="API-сессия активна"
          detail="API использует отдельный вход и отдельные cookies, независимо от Crossplat."
        >
          <div className="platform-auth-panel">
            <span className="platform-badge platform-badge--active">Авторизовано</span>
            <p>{`${dashboard.profile.email} может выпускать, отзывать и просматривать API-ключи с ограниченными scope.`}</p>
          </div>
        </PlatformSectionCard>
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Сценарий"
          title="Поток работы с Crossplat API"
          detail="Для активного продукта уже используются реальные external-роуты backend."
        >
          <ul className="platform-list">
            <li>Создайте ключ только для тех машин, которые действительно нужны.</li>
            <li>
              Используйте bearer-токен для <code>{dashboard.externalApiBaseUrl}</code>.
            </li>
            <li>Проверьте шаблоны команд машины перед созданием задачи.</li>
            <li>Отслеживайте выполнение через state, логи, summary и export результатов.</li>
          </ul>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Навигация"
          title="Что открыть дальше"
          detail="Кабинет отвечает за доступ, а публичный docs-сайт за описание endpoint-ов."
        >
          <ul className="platform-list">
            <li>Сейчас описано {dashboard.endpointCount} live external endpoint-ов.</li>
            <li>Сейчас доступно {stats.active} активных ключей.</li>
            <li>{stats.runEnabled} ключей могут создавать задачи.</li>
            <li>{stats.mostUsed[0] ? `${stats.mostUsed[0].name} сейчас является самым используемым ключом.` : "Usage появится здесь после первых API-запросов."}</li>
          </ul>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
