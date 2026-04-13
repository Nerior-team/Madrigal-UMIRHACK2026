import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import type { AccountProfileDetails } from "../../core";
import type { PlatformAuthState } from "../api/platform";
import { PLATFORM_ROUTE_ITEMS, type PlatformRouteKey } from "../routes";

type PlatformShellProps = PropsWithChildren<{
  activeRoute: PlatformRouteKey;
  authState: PlatformAuthState;
  profile: AccountProfileDetails | null;
  generatedAt: string | null;
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
  authState,
  profile,
  generatedAt,
  children,
}: PlatformShellProps) {
  return (
    <div className="platform-shell" data-testid="platform-shell">
      <div className="platform-shell__backdrop" aria-hidden="true" />
      <header className="platform-shell__header">
        <div className="platform-shell__brand">
          <span className="platform-shell__mark">N</span>
          <div>
            <strong>Nerior Platform</strong>
            <span>{formatSyncLabel(generatedAt)}</span>
          </div>
        </div>
        <nav className="platform-shell__nav" aria-label="Developer portal navigation">
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
          {authState === "authenticated" && profile ? (
            <>
              <span className="platform-shell__account-label">Authenticated</span>
              <strong>{profile.email}</strong>
              <a className="platform-inline-link" href="https://nerior.store/profile/api-keys">
                Open profile
              </a>
            </>
          ) : (
            <>
              <span className="platform-shell__account-label">Guest</span>
              <strong>Public docs available</strong>
              <a className="platform-inline-link" href="https://nerior.store/login">
                Sign in on nerior.store
              </a>
            </>
          )}
        </div>
      </header>
      <main className="platform-shell__content">{children}</main>
    </div>
  );
}
