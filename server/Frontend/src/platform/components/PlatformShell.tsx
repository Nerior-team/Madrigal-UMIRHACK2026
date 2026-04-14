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
    return "\u041e\u0436\u0438\u0434\u0430\u043d\u0438\u0435 \u043f\u0435\u0440\u0432\u043e\u0439 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "\u0412\u0440\u0435\u043c\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e";
  }

  return `\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043e ${new Intl.DateTimeFormat("ru-RU", {
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
        <nav className="platform-shell__nav" aria-label={"\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f API-\u043a\u0430\u0431\u0438\u043d\u0435\u0442\u0430"}>
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
          <span className="platform-shell__account-label">{"\u041e\u0442\u0434\u0435\u043b\u044c\u043d\u0430\u044f API-\u0441\u0435\u0441\u0441\u0438\u044f"}</span>
          <strong>{profile.email}</strong>
          <div className="platform-shell__account-actions">
            <a className="platform-inline-link" href="https://docs.nerior.store">
              {"\u041e\u0442\u043a\u0440\u044b\u0442\u044c docs"}
            </a>
            <a className="platform-inline-link" href="https://crossplat.nerior.store/machines">
              {"\u041e\u0442\u043a\u0440\u044b\u0442\u044c Crossplat"}
            </a>
            <button type="button" className="platform-inline-link" onClick={onSignOut}>
              {"\u0412\u044b\u0439\u0442\u0438"}
            </button>
          </div>
        </div>
      </aside>
      <main className="platform-shell__content">{children}</main>
    </div>
  );
}
