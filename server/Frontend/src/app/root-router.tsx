import type { ReactNode } from "react";
import { PlatformRouter } from "./platform-router";
import { resolveHostApp } from "./platform-host";
import { AppRouter } from "./router";
import type { PlatformSessionStatus } from "../platform/session";

type RootRouterProps = {
  hostname?: string;
  renderMainApp?: () => ReactNode;
  renderPlatformApp?: () => ReactNode;
  initialPlatformSessionStatus?: PlatformSessionStatus;
  disablePlatformSessionBootstrap?: boolean;
};

function getBrowserHostname(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname;
}

export function RootRouter({
  hostname = getBrowserHostname(),
  renderMainApp,
  renderPlatformApp,
  initialPlatformSessionStatus,
  disablePlatformSessionBootstrap = false,
}: RootRouterProps) {
  if (resolveHostApp(hostname) === "platform") {
    return (
      <PlatformRouter
        renderApp={renderPlatformApp}
        initialSessionStatus={initialPlatformSessionStatus}
        disableSessionBootstrap={disablePlatformSessionBootstrap}
      />
    );
  }

  return <AppRouter renderApp={renderMainApp} />;
}
