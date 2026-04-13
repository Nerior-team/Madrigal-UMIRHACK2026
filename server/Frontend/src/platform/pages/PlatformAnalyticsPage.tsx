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
        <PlatformStatCard label="Services" value={String(PLATFORM_PRODUCTS.length)} detail="Products listed in the cabinet" />
        <PlatformStatCard label="Live now" value={String(availableProducts)} detail="Products currently available for API access" />
        <PlatformStatCard label="Total keys" value={String(stats.total)} detail="Keys linked to this account" />
        <PlatformStatCard label="Active keys" value={String(stats.active)} detail="Currently usable keys" />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Products"
          title="Availability snapshot"
          detail="Usage is currently tracked only for services with live API access."
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
                <p>{product.status === "available" ? "Usage data is active for this service." : "Usage data will appear after launch."}</p>
              </article>
            ))}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Ranking"
          title="Most-used keys"
          detail="Ordered by the real `uses_count` field from the backend."
        >
          <div className="platform-ranked-list">
            {stats.mostUsed.length ? (
              stats.mostUsed.map((item) => (
                <article key={item.id} className="platform-ranked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.permission === "run" ? "Crossplat read + run" : "Crossplat read only"}</span>
                  </div>
                  <strong>{item.usesCount}</strong>
                </article>
              ))
            ) : (
              <p className="platform-empty-state">Usage appears after the first API requests land.</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>

      <PlatformSectionCard
        eyebrow="Recency"
        title="Latest activity"
        detail="A compact view of when each key last touched the API."
      >
        <div className="platform-ranked-list">
          {stats.mostRecent.length ? (
            stats.mostRecent.map((item) => (
              <article key={item.id} className="platform-ranked-row">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.lastUsedIp || "IP unavailable"}</span>
                </div>
                <strong>{item.lastUsedAt || "Unavailable"}</strong>
              </article>
            ))
          ) : (
            <p className="platform-empty-state">No recent activity has been recorded yet.</p>
          )}
        </div>
      </PlatformSectionCard>

      <PlatformSectionCard
        eyebrow="Inventory"
        title="All keys"
        detail="A flattened operational view across active and revoked Crossplat credentials."
      >
        <div className="platform-table">
          <div className="platform-table__head">
            <span>Name</span>
            <span>Permission</span>
            <span>Status</span>
            <span>Calls</span>
            <span>Machines</span>
          </div>
          {apiKeys.map((item) => (
            <div key={item.id} className="platform-table__row">
              <span>{item.name}</span>
              <span>{item.permission === "run" ? "Run" : "Read"}</span>
              <span>{item.isActive ? "Active" : "Revoked"}</span>
              <span>{item.usesCount}</span>
              <span>{item.machineIds.length}</span>
            </div>
          ))}
        </div>
      </PlatformSectionCard>
    </div>
  );
}
