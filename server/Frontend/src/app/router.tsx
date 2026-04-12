import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { App } from "../App";
import { AppShell } from "../components/layout/AppShell";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AUTH_ROUTE_PATHS, WORKSPACE_ROUTE_PATHS } from "./route-constants";

type AppRouterProps = {
  renderApp?: () => ReactNode;
};

type RoutedLayoutProps = {
  renderApp: () => ReactNode;
};

function AuthRouteElement({ renderApp }: RoutedLayoutProps) {
  return (
    <AuthLayout>
      {renderApp()}
    </AuthLayout>
  );
}

function WorkspaceRouteElement({ renderApp }: RoutedLayoutProps) {
  return (
    <AppShell>
      {renderApp()}
    </AppShell>
  );
}

export function AppRouter({
  renderApp = () => <App />,
}: AppRouterProps) {
  return (
    <Routes>
      {AUTH_ROUTE_PATHS.map((path) => (
        <Route
          key={path}
          path={path}
          element={<AuthRouteElement renderApp={renderApp} />}
        />
      ))}
      {WORKSPACE_ROUTE_PATHS.map((path) => (
        <Route
          key={path}
          path={path}
          element={<WorkspaceRouteElement renderApp={renderApp} />}
        />
      ))}
      <Route path="*" element={<Navigate to="/machines" replace />} />
    </Routes>
  );
}
