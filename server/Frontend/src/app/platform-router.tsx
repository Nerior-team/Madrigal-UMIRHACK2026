import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PlatformApp } from "../platform/PlatformApp";
import { PlatformAuthPage } from "../platform/PlatformAuthPage";
import { platformAuthPath, PLATFORM_AUTH_ROUTE_PATHS, type PlatformAuthMode } from "../platform/auth-routes";
import { PlatformSessionProvider, usePlatformSession, type PlatformSessionStatus } from "../platform/session";
import { PLATFORM_ROUTE_ITEMS } from "../platform/routes";

type PlatformRouterProps = {
  renderApp?: () => ReactNode;
  initialSessionStatus?: PlatformSessionStatus;
  disableSessionBootstrap?: boolean;
};

type PlatformAuthRouteElementProps = {
  mode: PlatformAuthMode;
};

function PlatformLoadingState() {
  return <div className="platform-loading-state">Loading platform...</div>;
}

function PlatformAuthRouteElement({ mode }: PlatformAuthRouteElementProps) {
  const { status } = usePlatformSession();

  if (status === "loading") {
    return <PlatformLoadingState />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <PlatformAuthPage mode={mode} />;
}

function PlatformWorkspaceRouteElement({ renderApp }: { renderApp: () => ReactNode }) {
  const { status } = usePlatformSession();
  const location = useLocation();

  if (status === "loading") {
    return <PlatformLoadingState />;
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        to={platformAuthPath("login")}
        replace
        state={{ next: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{renderApp()}</>;
}

export function PlatformRouter({
  renderApp = () => <PlatformApp />,
  initialSessionStatus,
  disableSessionBootstrap = false,
}: PlatformRouterProps) {
  return (
    <PlatformSessionProvider
      initialStatus={initialSessionStatus}
      disableBootstrap={disableSessionBootstrap}
    >
      <Routes>
        {PLATFORM_AUTH_ROUTE_PATHS.map((path) => {
          const mode = path === "/login"
            ? "login"
            : path === "/register"
              ? "register"
              : path === "/verify"
                ? "verify"
                : path === "/forgot-password"
                  ? "forgot-password"
                  : "reset-password";

          return (
            <Route
              key={path}
              path={path}
              element={<PlatformAuthRouteElement mode={mode} />}
            />
          );
        })}
        {PLATFORM_ROUTE_ITEMS.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={<PlatformWorkspaceRouteElement renderApp={renderApp} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PlatformSessionProvider>
  );
}
