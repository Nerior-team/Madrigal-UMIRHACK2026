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
        primaryActionLabel={"\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e"}
        primaryActionHref="https://crossplat.nerior.store"
        secondaryActionLabel={"\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043d\u0430\u043c\u0438"}
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
      <Routes>
        <Route path="/" element={<Navigate to="/general" replace />} />
        <Route path="*" element={<PublicDocsPage />} />
      </Routes>
    );
  }

  if (kind === "community") {
    return (
      <Routes>
        <Route path="*" element={<PublicCommunityPage />} />
      </Routes>
    );
  }

  if (kind === "help") {
    return (
      <Routes>
        <Route path="*" element={<PublicHelpPage />} />
      </Routes>
    );
  }

  return (
    <PublicShell title={getPublicTitle(kind)} navItems={navItems}>
      <Routes>
        <Route path="/" element={<NeriorHomePage />} />
        <Route path="/updates" element={<NeriorUpdatesPage />} />
        <Route path="/updates/:slug" element={<PublicArticlePage />} />
        <Route path="/business" element={<PublicBusinessPage />} />
        <Route path="/company" element={<Navigate to="/company/about" replace />} />
        <Route path="/company/about" element={<PublicCompanyPage />} />
        <Route path="/company/careers" element={<PublicCompanyPage />} />
        <Route path="/company/stories" element={<PublicCompanyPage />} />
        <Route path="/developers" element={<PublicDevelopersPage />} />
        <Route path="/contact" element={<PublicContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicShell>
  );
}
