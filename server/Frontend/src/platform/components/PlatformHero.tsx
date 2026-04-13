type PlatformHeroProps = {
  title: string;
  subtitle: string;
  kicker: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
};

export function PlatformHero({
  title,
  subtitle,
  kicker,
  primaryCtaHref,
  primaryCtaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
}: PlatformHeroProps) {
  return (
    <section className="platform-hero">
      <div className="platform-hero__copy">
        <span className="platform-eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="platform-hero__actions">
        <a className="platform-button platform-button--primary" href={primaryCtaHref}>
          {primaryCtaLabel}
        </a>
        <a className="platform-button" href={secondaryCtaHref}>
          {secondaryCtaLabel}
        </a>
      </div>
    </section>
  );
}
