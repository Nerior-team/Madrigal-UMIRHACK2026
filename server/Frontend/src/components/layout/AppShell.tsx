import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="route-layout route-layout--workspace" data-testid="app-shell">
      {children}
    </div>
  );
}
