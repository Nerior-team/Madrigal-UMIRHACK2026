import type { PropsWithChildren } from "react";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="route-layout route-layout--auth" data-testid="auth-layout">
      {children}
    </div>
  );
}
