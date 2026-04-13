import type { ReactNode } from "react";
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

export function RootRouter({
  hostname = getBrowserHostname(),
  renderCrossplatApp,
  renderApiApp,
  initialApiSessionStatus,
  disableApiSessionBootstrap = false,
}: RootRouterProps) {
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
