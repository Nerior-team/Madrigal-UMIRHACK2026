import type { PropsWithChildren } from "react";

export function PlatformAuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="platform-auth-layout" data-testid="platform-auth-layout">
      <aside className="platform-auth-layout__aside">
        <a className="platform-auth-layout__brand" href="/">
          <span className="platform-auth-layout__mark">N</span>
          <div>
            <strong>Nerior Platform</strong>
            <span>Developer access</span>
          </div>
        </a>
        <div className="platform-auth-layout__copy">
          <span className="platform-eyebrow">Platform</span>
          <h1>Build on top of machines, tasks, logs, and results.</h1>
          <p>
            Separate platform access, scoped API keys, and operational visibility in a workspace
            designed for developers.
          </p>
        </div>
      </aside>
      <main className="platform-auth-layout__main">{children}</main>
    </div>
  );
}
