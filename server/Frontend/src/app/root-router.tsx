import { useEffect, type ReactNode } from "react";
import { resolveHostApp } from "./platform-host";
import { HostApp } from "./host-app";
import type { PlatformSessionStatus } from "../platform/session";

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
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = getHostDocumentTitle(hostname);
  }, [hostname]);

  return (
    <HostApp
      kind={resolveHostApp(hostname)}
      renderCrossplatApp={renderCrossplatApp}
      renderApiApp={renderApiApp}
      initialApiSessionStatus={initialApiSessionStatus}
      disableApiSessionBootstrap={disableApiSessionBootstrap}
    />
  );
}
