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
        kicker="API access"
        title="Issue and control API keys across Nerior services."
        subtitle="This cabinet handles API-key access, product availability, scope boundaries, and usage visibility. Documentation lives separately on docs.nerior.store."
        primaryCtaHref="/keys"
        primaryCtaLabel="Manage API keys"
        secondaryCtaHref="https://docs.nerior.store"
        secondaryCtaLabel="Open docs"
      />

      <section className="platform-stats-grid">
        <PlatformStatCard label="Services" value={String(PLATFORM_PRODUCTS.length)} detail="Products listed in the cabinet" />
        <PlatformStatCard label="Live now" value={String(availableProducts)} detail="Products currently available for API access" />
        <PlatformStatCard label="Keys" value={String(stats.total)} detail="Developer keys in your account" />
        <PlatformStatCard label="Machines" value={String(dashboard.machineOptions.length)} detail="Crossplat scopes available today" />
        <PlatformStatCard label="Calls" value={String(stats.totalUses)} detail="Total recorded API key usage" />
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Products"
          title="Service availability"
          detail="Only services backed by live API contracts can be selected for new keys."
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
                    Open product
                  </a>
                ) : (
                  <span className="platform-disabled-link">Unavailable</span>
                )}
              </article>
            ))}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Session"
          title="API session is active"
          detail="API access uses a separate sign-in flow and separate cookies from Crossplat."
        >
          <div className="platform-auth-panel">
            <span className="platform-badge platform-badge--active">Signed in</span>
            <p>{`${dashboard.profile.email} can issue, revoke, and inspect scoped API keys.`}</p>
          </div>
        </PlatformSectionCard>
      </section>

      <section className="platform-two-column">
        <PlatformSectionCard
          eyebrow="Workflow"
          title="Crossplat API flow"
          detail="The currently active product uses the real external routes already exposed by the backend."
        >
          <ul className="platform-list">
            <li>Create a scoped key for the machines you actually need.</li>
            <li>
              Use the bearer token against <code>{dashboard.externalApiBaseUrl}</code>.
            </li>
            <li>Inspect machine command templates before creating tasks.</li>
            <li>Track execution through state, logs, summaries, and result exports.</li>
          </ul>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Reference"
          title="What to open next"
          detail="Use the cabinet for access, and the public docs site for endpoint reference."
        >
          <ul className="platform-list">
            <li>{dashboard.endpointCount} live external endpoints are currently documented.</li>
            <li>{stats.active} active keys are available right now.</li>
            <li>{stats.runEnabled} keys can create tasks.</li>
            <li>{stats.mostUsed[0] ? `${stats.mostUsed[0].name} is currently the most-used key.` : "Usage will appear here once the first API requests land."}</li>
          </ul>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
