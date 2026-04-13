import type { ReactNode } from "react";
import { AppRouter } from "./router";
import { PlatformRouter } from "./platform-router";
import type { HostAppKind } from "./platform-host";
import type { PlatformSessionStatus } from "../platform/session";
import { PublicRouter } from "../public/PublicRouter";

type HostAppProps = {
  kind: HostAppKind;
  renderCrossplatApp?: () => ReactNode;
  renderApiApp?: () => ReactNode;
  initialApiSessionStatus?: PlatformSessionStatus;
  disableApiSessionBootstrap?: boolean;
};

export function HostApp({
  kind,
  renderCrossplatApp,
  renderApiApp,
  initialApiSessionStatus,
  disableApiSessionBootstrap = false,
}: HostAppProps) {
  if (kind === "crossplat") {
    return <AppRouter renderApp={renderCrossplatApp} />;
  }

  if (kind === "api") {
    return (
      <PlatformRouter
        renderApp={renderApiApp}
        initialSessionStatus={initialApiSessionStatus}
        disableSessionBootstrap={disableApiSessionBootstrap}
      />
    );
  }

  return <PublicRouter kind={kind} />;
}
