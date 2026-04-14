import type { ApiKeyRead } from "../../core";
import type { PlatformApiKeyStats } from "../api/platform";
import { PlatformSectionCard } from "../components/PlatformSectionCard";
import { PlatformStatCard } from "../components/PlatformStatCard";
import { PLATFORM_PRODUCTS } from "../products";

type PlatformAnalyticsPageProps = {
  apiKeys: ApiKeyRead[];
  stats: PlatformApiKeyStats;
};

export function PlatformAnalyticsPage({
  apiKeys,
  stats,
}: PlatformAnalyticsPageProps) {
  const availableProducts = PLATFORM_PRODUCTS.filter((item) => item.status === "available").length;

  return (
    <div className="platform-page platform-page--analytics">
      <section className="platform-stats-grid">
        <PlatformStatCard label="Сервисы" value={String(PLATFORM_PRODUCTS.length)} detail="Продукты, показанные в кабинете" />
        <PlatformStatCard label="Активны" value={String(availableProducts)} detail="Продукты с доступным API" />
        <PlatformStatCard label="Всего ключей" value={String(stats.total)} detail="Ключи, связанные с этим аккаунтом" />
        <PlatformStatCard label="Активные ключи" value={String(stats.active)} detail="Ключи, которые можно использовать сейчас" />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Продукты"
          title="Срез доступности"
          detail="Статистика usage сейчас собирается только по сервисам с живым API."
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
                <p>{product.status === "available" ? "Для этого сервиса уже собирается usage-статистика." : "Статистика появится после запуска."}</p>
              </article>
            ))}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Рейтинг"
          title="Самые используемые ключи"
          detail="Сортировка идёт по реальному полю `uses_count` из backend."
        >
          <div className="platform-ranked-list">
            {stats.mostUsed.length ? (
              stats.mostUsed.map((item) => (
                <article key={item.id} className="platform-ranked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.permission === "run" ? "Crossplat: чтение и запуск" : "Crossplat: только чтение"}</span>
                  </div>
                  <strong>{item.usesCount}</strong>
                </article>
              ))
            ) : (
              <p className="platform-empty-state">Статистика появится после первых API-запросов.</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>

      <PlatformSectionCard
        eyebrow="Активность"
        title="Последние обращения"
        detail="Компактный срез по тому, когда каждый ключ в последний раз обращался к API."
      >
        <div className="platform-ranked-list">
          {stats.mostRecent.length ? (
            stats.mostRecent.map((item) => (
              <article key={item.id} className="platform-ranked-row">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.lastUsedIp || "IP недоступен"}</span>
                </div>
                <strong>{item.lastUsedAt || "Нет данных"}</strong>
              </article>
            ))
          ) : (
            <p className="platform-empty-state">Последняя активность пока не зафиксирована.</p>
          )}
        </div>
      </PlatformSectionCard>

      <PlatformSectionCard
        eyebrow="Реестр"
        title="Все ключи"
        detail="Плоский операционный срез по активным и отозванным ключам Crossplat."
      >
        <div className="platform-table">
          <div className="platform-table__head">
            <span>Название</span>
            <span>Доступ</span>
            <span>Статус</span>
            <span>Вызовы</span>
            <span>Машины</span>
          </div>
          {apiKeys.map((item) => (
            <div key={item.id} className="platform-table__row">
              <span>{item.name}</span>
              <span>{item.permission === "run" ? "Запуск" : "Чтение"}</span>
              <span>{item.isActive ? "Активен" : "Отозван"}</span>
              <span>{item.usesCount}</span>
              <span>{item.machineIds.length}</span>
            </div>
          ))}
        </div>
      </PlatformSectionCard>
    </div>
  );
}
