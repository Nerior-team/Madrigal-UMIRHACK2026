import type { PropsWithChildren, ReactNode } from "react";

type PlatformSectionCardProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}>;

export function PlatformSectionCard({
  eyebrow,
  title,
  detail,
  action,
  children,
}: PlatformSectionCardProps) {
  return (
    <section className="platform-section-card">
      <header className="platform-section-card__header">
        <div>
          {eyebrow ? <span className="platform-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {detail ? <p>{detail}</p> : null}
        </div>
        {action ? <div className="platform-section-card__action">{action}</div> : null}
      </header>
      <div className="platform-section-card__body">{children}</div>
    </section>
  );
}
