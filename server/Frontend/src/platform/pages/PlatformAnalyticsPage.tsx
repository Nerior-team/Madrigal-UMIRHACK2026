import type { ApiKeyRead } from "../../core";
import type { PlatformApiKeyStats } from "../api/platform";
import { PlatformSectionCard } from "../components/PlatformSectionCard";
import { PlatformStatCard } from "../components/PlatformStatCard";

type PlatformAnalyticsPageProps = {
  apiKeys: ApiKeyRead[];
  stats: PlatformApiKeyStats;
};

export function PlatformAnalyticsPage({
  apiKeys,
  stats,
}: PlatformAnalyticsPageProps) {
  return (
    <div className="platform-page platform-page--analytics">
      <section className="platform-stats-grid">
        <PlatformStatCard label="Total keys" value={String(stats.total)} detail="Keys linked to this account" />
        <PlatformStatCard label="Active keys" value={String(stats.active)} detail="Currently usable keys" />
        <PlatformStatCard label="Run access" value={String(stats.runEnabled)} detail="Keys allowed to create tasks" />
        <PlatformStatCard label="Total calls" value={String(stats.totalUses)} detail="Recorded key usage count" />
      </section>

      <section className="platform-two-column">
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
                    <span>{item.permission === "run" ? "Read + run tasks" : "Read only"}</span>
                  </div>
                  <strong>{item.usesCount}</strong>
                </article>
              ))
            ) : (
              <p className="platform-empty-state">Usage appears after the first API requests land.</p>
            )}
          </div>
        </PlatformSectionCard>

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
      </section>

      <PlatformSectionCard
        eyebrow="Inventory"
        title="All keys"
        detail="A flattened operational view across active and revoked credentials."
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
