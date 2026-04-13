import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import type { AccountProfileDetails } from "../../core";
import { PLATFORM_ROUTE_ITEMS, type PlatformRouteKey } from "../routes";

type PlatformShellProps = PropsWithChildren<{
  activeRoute: PlatformRouteKey;
  profile: AccountProfileDetails;
  generatedAt: string | null;
  onSignOut: () => void;
}>;

function formatSyncLabel(value: string | null): string {
  if (!value) {
    return "Waiting for first sync";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Sync time unavailable";
  }

  return `Synced ${new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(timestamp)}`;
}

export function PlatformShell({
  activeRoute,
  profile,
  generatedAt,
  onSignOut,
  children,
}: PlatformShellProps) {
  return (
    <div className="platform-shell" data-testid="platform-shell">
      <aside className="platform-shell__sidebar">
        <a className="platform-shell__brand" href="/">
          <span className="platform-shell__mark">N</span>
          <div>
            <strong>Nerior API</strong>
            <span>{formatSyncLabel(generatedAt)}</span>
          </div>
        </a>
        <nav className="platform-shell__nav" aria-label="API cabinet navigation">
          {PLATFORM_ROUTE_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={item.key === activeRoute ? "platform-nav-link platform-nav-link--active" : "platform-nav-link"}
            >
              <span>{item.eyebrow}</span>
              <strong>{item.label}</strong>
            </NavLink>
          ))}
        </nav>
        <div className="platform-shell__account">
          <span className="platform-shell__account-label">API access</span>
          <strong>{profile.email}</strong>
          <div className="platform-shell__account-actions">
            <a className="platform-inline-link" href="https://docs.nerior.store">
              Open Docs
            </a>
            <a className="platform-inline-link" href="https://crossplat.nerior.store/machines">
              Open Crossplat
            </a>
            <button type="button" className="platform-inline-link" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="platform-shell__content">{children}</main>
    </div>
  );
}
