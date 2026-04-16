import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { resolveHostApp } from "./platform-host";
import { HostApp } from "./host-app";
import type { PlatformSessionStatus } from "../platform/session";
import { AppRouter } from "./router";
import { AUTH_ROUTE_PATHS } from "./route-constants";

type RootRouterProps = {
  hostname?: string;
  renderCrossplatApp?: () => ReactNode;
  renderApiApp?: () => ReactNode;
  initialApiSessionStatus?: PlatformSessionStatus;
  disableApiSessionBootstrap?: boolean;
};

function getBrowserHostname(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname;
}

function getHostDocumentTitle(hostname: string): string {
  const kind = resolveHostApp(hostname);

  switch (kind) {
    case "crossplat":
      return "Crossplat";
    case "api":
      return "Nerior API";
    case "docs":
      return "Nerior Docs";
    case "community":
      return "Nerior Community";
    case "help":
      return "Nerior Help";
    case "smart-planner":
      return "Smart planner";
    case "karpik":
      return "Karpik";
    default:
      return "Nerior";
  }
}

export function RootRouter({
  hostname = getBrowserHostname(),
  renderCrossplatApp,
  renderApiApp,
  initialApiSessionStatus,
  disableApiSessionBootstrap = false,
}: RootRouterProps) {
  const location = useLocation();
  const kind = resolveHostApp(hostname);
  const isPublicAuthRoute =
    (kind === "nerior-site" || kind === "community") &&
    AUTH_ROUTE_PATHS.includes(location.pathname as (typeof AUTH_ROUTE_PATHS)[number]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = getHostDocumentTitle(hostname);
  }, [hostname]);

  if (isPublicAuthRoute) {
    return <AppRouter renderApp={renderCrossplatApp} />;
  }

  return (
    <HostApp
      kind={kind}
      renderCrossplatApp={renderCrossplatApp}
      renderApiApp={renderApiApp}
      initialApiSessionStatus={initialApiSessionStatus}
      disableApiSessionBootstrap={disableApiSessionBootstrap}
    />
  );
}
