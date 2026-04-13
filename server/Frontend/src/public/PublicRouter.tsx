import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { HostAppKind } from "../app/platform-host";
import { PublicTopbar } from "./components/PublicTopbar";
import { PublicCommunityPage } from "./pages/PublicCommunityPage";
import { PublicContactPage } from "./pages/PublicContactPage";
import { PublicArticlePage } from "./pages/PublicArticlePage";
import { PublicDocsPage } from "./pages/PublicDocsPage";
import { PublicBusinessPage } from "./pages/PublicBusinessPage";
import { PublicCompanyPage } from "./pages/PublicCompanyPage";
import { PublicDevelopersPage } from "./pages/PublicDevelopersPage";
import { PublicHelpPage } from "./pages/PublicHelpPage";
import { PublicHoldingPage } from "./pages/PublicHoldingPage";
import { NeriorHomePage } from "./pages/NeriorHomePage";
import { NeriorUpdatesPage } from "./pages/NeriorUpdatesPage";
import { getPublicTitle, resolvePublicNav } from "./site-content";

type PublicRouterProps = {
  kind: Exclude<HostAppKind, "crossplat" | "api">;
};

function PublicShell({
  title,
  navItems,
  children,
}: {
  title: string;
  navItems: ReturnType<typeof resolvePublicNav>;
  children: ReactNode;
}) {
  return (
    <div className="public-shell">
      <PublicTopbar
        title={title}
        navItems={navItems}
        primaryActionLabel="Попробуйте бесплатно"
        primaryActionHref="https://crossplat.nerior.store"
        secondaryActionLabel="Связаться с нами"
        secondaryActionHref="https://nerior.store/contact"
      />
      {children}
    </div>
  );
}

export function PublicRouter({ kind }: PublicRouterProps) {
  const navItems = resolvePublicNav(kind);

  if (kind === "smart-planner") {
    return (
      <PublicShell title="Nerior" navItems={navItems}>
        <PublicHoldingPage title="Smart-Planner" />
      </PublicShell>
    );
  }

  if (kind === "karpik") {
    return (
      <PublicShell title="Nerior" navItems={navItems}>
        <PublicHoldingPage title="Karpik" />
      </PublicShell>
    );
  }

  if (kind === "docs") {
    return (
      <PublicShell title="Nerior" navItems={navItems}>
        <Routes>
          <Route path="*" element={<PublicDocsPage />} />
        </Routes>
      </PublicShell>
    );
  }

  if (kind === "community") {
    return (
      <PublicShell title="Nerior" navItems={navItems}>
        <Routes>
          <Route path="*" element={<PublicCommunityPage />} />
        </Routes>
      </PublicShell>
    );
  }

  if (kind === "help") {
    return (
      <PublicShell title="Nerior" navItems={navItems}>
        <Routes>
          <Route path="*" element={<PublicHelpPage />} />
        </Routes>
      </PublicShell>
    );
  }

  return (
    <PublicShell title={getPublicTitle(kind)} navItems={navItems}>
      <Routes>
        <Route path="/" element={<NeriorHomePage />} />
        <Route path="/updates" element={<NeriorUpdatesPage />} />
        <Route path="/updates/:slug" element={<PublicArticlePage />} />
        <Route path="/business" element={<PublicBusinessPage />} />
        <Route path="/company" element={<PublicCompanyPage />} />
        <Route path="/developers" element={<PublicDevelopersPage />} />
        <Route path="/contact" element={<PublicContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicShell>
  );
}
