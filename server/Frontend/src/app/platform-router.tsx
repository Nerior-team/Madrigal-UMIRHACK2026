import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PlatformApp } from "../platform/PlatformApp";
import { PLATFORM_ROUTE_PATHS } from "../platform/routes";

type PlatformRouterProps = {
  renderApp?: () => ReactNode;
};

export function PlatformRouter({
  renderApp = () => <PlatformApp />,
}: PlatformRouterProps) {
  return (
    <Routes>
      {PLATFORM_ROUTE_PATHS.map((path) => (
        <Route key={path} path={path} element={<>{renderApp()}</>} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
