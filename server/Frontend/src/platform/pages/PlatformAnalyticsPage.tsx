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
        <PlatformStatCard label={"\u0421\u0435\u0440\u0432\u0438\u0441\u044b"} value={String(PLATFORM_PRODUCTS.length)} detail={"\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b, \u043f\u043e\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0435 \u0432 \u043a\u0430\u0431\u0438\u043d\u0435\u0442\u0435"} />
        <PlatformStatCard label={"\u0410\u043a\u0442\u0438\u0432\u043d\u044b"} value={String(availableProducts)} detail={"\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b \u0441 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u043c API"} />
        <PlatformStatCard label={"\u0412\u0441\u0435\u0433\u043e \u043a\u043b\u044e\u0447\u0435\u0439"} value={String(stats.total)} detail={"\u041a\u043b\u044e\u0447\u0438, \u0441\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0435 \u0441 \u044d\u0442\u0438\u043c \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u043c"} />
        <PlatformStatCard label={"\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043a\u043b\u044e\u0447\u0438"} value={String(stats.active)} detail={"\u041a\u043b\u044e\u0447\u0438, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u043c\u043e\u0436\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0441\u0435\u0439\u0447\u0430\u0441"} />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard eyebrow={"\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b"} title={"\u0421\u0440\u0435\u0437 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u0438"} detail={"\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f \u0441\u0435\u0439\u0447\u0430\u0441 \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u043f\u043e \u0441\u0435\u0440\u0432\u0438\u0441\u0430\u043c \u0441 \u0436\u0438\u0432\u044b\u043c API."}>
          <div className="platform-product-grid">
            {PLATFORM_PRODUCTS.map((product) => (
              <article
                key={product.key}
                className={product.status === "available" ? "platform-product-card" : "platform-product-card platform-product-card--disabled"}
              >
                <div className="platform-product-card__header">
                  <strong>{product.name}</strong>
                  <span className={product.status === "available" ? "platform-badge platform-badge--active" : "platform-badge"}>
                    {product.note}
                  </span>
                </div>
                <p>
                  {product.status === "available"
                    ? "\u0414\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u0443\u0436\u0435 \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f."
                    : "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u0437\u0430\u043f\u0443\u0441\u043a\u0430."}
                </p>
              </article>
            ))}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard eyebrow={"\u0420\u0435\u0439\u0442\u0438\u043d\u0433"} title={"\u0421\u0430\u043c\u044b\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u043c\u044b\u0435 \u043a\u043b\u044e\u0447\u0438"} detail={"\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430 \u0438\u0434\u0451\u0442 \u043f\u043e \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c\u0443 \u043f\u043e\u043b\u044e uses_count \u0438\u0437 backend."}>
          <div className="platform-ranked-list">
            {stats.mostUsed.length ? (
              stats.mostUsed.map((item) => (
                <article key={item.id} className="platform-ranked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.permission === "run" ? "Crossplat: \u0447\u0442\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u043f\u0443\u0441\u043a" : "Crossplat: \u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u0435\u043d\u0438\u0435"}</span>
                  </div>
                  <strong>{item.usesCount}</strong>
                </article>
              ))
            ) : (
              <p className="platform-empty-state">{"\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u043f\u0435\u0440\u0432\u044b\u0445 API-\u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432."}</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>

      <PlatformSectionCard eyebrow={"\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c"} title={"\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043e\u0431\u0440\u0430\u0449\u0435\u043d\u0438\u044f"} detail={"\u041a\u043e\u043c\u043f\u0430\u043a\u0442\u043d\u044b\u0439 \u0441\u0440\u0435\u0437 \u043f\u043e \u0442\u043e\u043c\u0443, \u043a\u043e\u0433\u0434\u0430 \u043a\u0430\u0436\u0434\u044b\u0439 \u043a\u043b\u044e\u0447 \u0432 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0440\u0430\u0437 \u043e\u0431\u0440\u0430\u0449\u0430\u043b\u0441\u044f \u043a API."}>
        <div className="platform-ranked-list">
          {stats.mostRecent.length ? (
            stats.mostRecent.map((item) => (
              <article key={item.id} className="platform-ranked-row">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.lastUsedIp || "IP \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d"}</span>
                </div>
                <strong>{item.lastUsedAt || "\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445"}</strong>
              </article>
            ))
          ) : (
            <p className="platform-empty-state">{"\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u043f\u043e\u043a\u0430 \u043d\u0435 \u0437\u0430\u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u0430."}</p>
          )}
        </div>
      </PlatformSectionCard>

      <PlatformSectionCard eyebrow={"\u0420\u0435\u0435\u0441\u0442\u0440"} title={"\u0412\u0441\u0435 \u043a\u043b\u044e\u0447\u0438"} detail={"\u041f\u043b\u043e\u0441\u043a\u0438\u0439 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0441\u0440\u0435\u0437 \u043f\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u043c \u0438 \u043e\u0442\u043e\u0437\u0432\u0430\u043d\u043d\u044b\u043c \u043a\u043b\u044e\u0447\u0430\u043c Crossplat."}>
        <div className="platform-table">
          <div className="platform-table__head">
            <span>{"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435"}</span>
            <span>{"\u0414\u043e\u0441\u0442\u0443\u043f"}</span>
            <span>{"\u0421\u0442\u0430\u0442\u0443\u0441"}</span>
            <span>{"\u0412\u044b\u0437\u043e\u0432\u044b"}</span>
            <span>{"\u041c\u0430\u0448\u0438\u043d\u044b"}</span>
          </div>
          {apiKeys.map((item) => (
            <div key={item.id} className="platform-table__row">
              <span>{item.name}</span>
              <span>{item.permission === "run" ? "\u0417\u0430\u043f\u0443\u0441\u043a" : "\u0427\u0442\u0435\u043d\u0438\u0435"}</span>
              <span>{item.isActive ? "\u0410\u043a\u0442\u0438\u0432\u0435\u043d" : "\u041e\u0442\u043e\u0437\u0432\u0430\u043d"}</span>
              <span>{item.usesCount}</span>
              <span>{item.machineIds.length}</span>
            </div>
          ))}
        </div>
      </PlatformSectionCard>
    </div>
  );
}
