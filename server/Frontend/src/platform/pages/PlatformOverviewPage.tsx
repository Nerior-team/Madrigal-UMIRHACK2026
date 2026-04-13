import type { PlatformDashboardData, PlatformApiKeyStats } from "../api/platform";
import { PlatformHero } from "../components/PlatformHero";
import { PlatformSectionCard } from "../components/PlatformSectionCard";
import { PlatformStatCard } from "../components/PlatformStatCard";

type PlatformOverviewPageProps = {
  dashboard: PlatformDashboardData;
  stats: PlatformApiKeyStats;
};

export function PlatformOverviewPage({ dashboard, stats }: PlatformOverviewPageProps) {
  return (
    <div className="platform-page platform-page--overview">
      <PlatformHero
        kicker="Developer platform"
        title="A precise API surface for orchestrating machines, tasks, logs, and results."
        subtitle="Same backend contracts, cleaner developer ergonomics. The portal focuses on key management, endpoint clarity, and usage visibility without adding a second platform backend."
        primaryCtaHref="/keys"
        primaryCtaLabel="Manage API keys"
        secondaryCtaHref="/docs"
        secondaryCtaLabel="Read the docs"
      />

      <section className="platform-stats-grid">
        <PlatformStatCard label="Endpoints" value={String(dashboard.endpointCount)} detail="Live routes available today" />
        <PlatformStatCard label="Keys" value={String(stats.total)} detail="Developer keys in your account" />
        <PlatformStatCard label="Machines" value={String(dashboard.machineOptions.length)} detail="Scopes available for keys" />
        <PlatformStatCard label="Calls" value={String(stats.totalUses)} detail="Total recorded API key usage" />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Quickstart"
          title="First request in under five minutes"
          detail="The flow intentionally mirrors the real contracts already exposed by the backend."
        >
          <ol className="platform-checklist">
            <li>Create a scoped API key with the minimum machine and command access you need.</li>
            <li>Use the bearer token against the shared `/api/v1/external/*` endpoints.</li>
            <li>List machines, inspect command templates, then create tasks with template params.</li>
            <li>Track execution through task state, logs, result summaries, and JSON export.</li>
          </ol>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Auth"
          title="Platform session is active"
          detail="Platform access uses a dedicated sign-in flow while keeping the same backend identity."
        >
          <div className="platform-auth-panel">
            <span className="platform-badge platform-badge--active">Authenticated</span>
            <p>{`${dashboard.profile.email} is ready to create and revoke scoped developer keys.`}</p>
          </div>
        </PlatformSectionCard>
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Surface area"
          title="What developers can do today"
          detail="Only features already backed by production contracts are shown."
        >
          <ul className="platform-list">
            <li>Enumerate machines visible to the API key scope.</li>
            <li>Inspect enabled command templates per machine.</li>
            <li>Create tasks with template params through the external API.</li>
            <li>Read task state, task logs, result payloads, summaries, and export JSON.</li>
          </ul>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Usage"
          title="Current usage snapshot"
          detail="These values come from the real API key records already stored in the backend."
        >
          <ul className="platform-list">
            <li>{stats.active} active keys currently available.</li>
            <li>{stats.runEnabled} keys can create tasks.</li>
            <li>{stats.expiring} keys have an expiry configured.</li>
            <li>{stats.mostUsed[0] ? `${stats.mostUsed[0].name} is the most-used key right now.` : "Usage will appear here once keys start making requests."}</li>
          </ul>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
