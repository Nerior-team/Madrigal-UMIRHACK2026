import type { ReactNode } from "react";
import { PlatformRouter } from "./platform-router";
import { resolveHostApp } from "./platform-host";
import { AppRouter } from "./router";

type RootRouterProps = {
  hostname?: string;
  renderMainApp?: () => ReactNode;
  renderPlatformApp?: () => ReactNode;
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
}: RootRouterProps) {
  if (resolveHostApp(hostname) === "platform") {
    return <PlatformRouter renderApp={renderPlatformApp} />;
  }

  return <AppRouter renderApp={renderMainApp} />;
}
