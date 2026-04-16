import { Link, useLocation } from "react-router-dom";
import { PublicSubnav } from "../components/PublicSubnav";
import { DOCS_TOP_TABS, getDocsPage, getDocText, getSidebarPages, resolveDocsPath } from "../docs-site";

function splitDoc(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const [firstLine, ...rest] = normalized.split("\n");
  const body = rest.join("\n").trim();
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return {
    heading: firstLine?.trim() ?? "",
    blocks,
  };
}

export function PublicDocsPage() {
  const location = useLocation();
  const page = getDocsPage(location.pathname);
  const sidebarPages = getSidebarPages(page.tab);
  const normalizedPath = resolveDocsPath(location.pathname);

  return (
    <>
      <PublicSubnav brand="Документация" brandHref={page.href} links={DOCS_TOP_TABS} />

      <div style={shellStyle}>
        <aside style={sidebarStyle}>
          <div style={sidebarStickyStyle}>
            {sidebarPages.map((entry) => {
              const isActive = entry.href === normalizedPath;

              return (
                <Link
                  key={entry.href}
                  to={entry.href}
                  style={{
                    ...sidebarLinkStyle,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.58)",
                    borderColor: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                  }}
                >
                  {entry.sidebarLabel}
                </Link>
              );
            })}
          </div>
        </aside>

        <main style={contentWrapStyle}>
          <p style={eyebrowStyle}>{DOCS_TOP_TABS.find((tab) => tab.key === page.tab)?.label}</p>
          <h1 style={titleStyle}>{page.title}</h1>

          <div style={stackStyle}>
            {page.docKeys.map((docKey, index) => {
              const document = splitDoc(getDocText(docKey));

              return (
                <section
                  key={`${docKey}-${index}`}
                  style={{
                    ...sectionStyle,
                    marginTop: index === 0 ? 0 : "1.5rem",
                  }}
                >
                  <p style={sectionEyebrowStyle}>{document.heading}</p>
                  <div style={sectionContentStyle}>
                    {document.blocks.map((block, blockIndex) => (
                      <p key={blockIndex} style={paragraphStyle}>
                        {block}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}

const shellStyle = {
  paddingTop: "var(--n-nav-h)",
  display: "grid",
  gridTemplateColumns: "260px minmax(0, 1fr)",
  minHeight: "100vh",
  background: "#000",
  color: "#fff",
} as const;

const sidebarStyle = {
  borderRight: "1px solid rgba(255,255,255,0.07)",
} as const;

const sidebarStickyStyle = {
  position: "sticky",
  top: "var(--n-nav-h)",
  display: "grid",
  gap: "0.25rem",
  padding: "2rem 1.1rem",
  height: "calc(100vh - var(--n-nav-h))",
  overflowY: "auto",
  alignContent: "start",
} as const;

const sidebarLinkStyle = {
  display: "block",
  border: "1px solid transparent",
  borderRadius: "0.4rem",
  padding: "0.72rem 0.85rem",
  textDecoration: "none",
  fontSize: "0.875rem",
  lineHeight: 1.45,
  transition: "color 0.15s ease, border-color 0.15s ease, background 0.15s ease",
} as const;

const contentWrapStyle = {
  minWidth: 0,
  padding: "3rem 3rem 6rem",
  maxWidth: "900px",
} as const;

const eyebrowStyle = {
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.32)",
  marginBottom: "1rem",
} as const;

const titleStyle = {
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  lineHeight: 1.06,
  letterSpacing: "-0.035em",
  margin: "0 0 2rem",
  color: "#fff",
} as const;

const stackStyle = {
  display: "grid",
  gap: "1.5rem",
} as const;

const sectionStyle = {
  borderTop: "1px solid rgba(255,255,255,0.09)",
  paddingTop: "1.5rem",
} as const;

const sectionEyebrowStyle = {
  margin: "0 0 1rem",
  fontSize: "0.78rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.38)",
} as const;

const sectionContentStyle = {
  display: "grid",
  gap: "1rem",
} as const;

const paragraphStyle = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "0.98rem",
  lineHeight: 1.85,
  whiteSpace: "pre-wrap",
} as const;
