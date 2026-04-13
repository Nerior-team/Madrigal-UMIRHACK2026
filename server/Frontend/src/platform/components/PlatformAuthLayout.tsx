import type { PropsWithChildren } from "react";

export function PlatformAuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="platform-auth-layout" data-testid="platform-auth-layout">
      <aside className="platform-auth-layout__aside">
        <a className="platform-auth-layout__brand" href="/">
          <span className="platform-auth-layout__mark">N</span>
          <div>
            <strong>Nerior API</strong>
            <span>Scoped access</span>
          </div>
        </a>
        <div className="platform-auth-layout__copy">
          <span className="platform-eyebrow">API</span>
          <h1>Manage scoped keys for Nerior services.</h1>
          <p>
            Separate API sign-in, product-level availability, key issuance, revocation, and usage
            visibility from one cabinet.
          </p>
        </div>
      </aside>
      <main className="platform-auth-layout__main">{children}</main>
    </div>
  );
}
