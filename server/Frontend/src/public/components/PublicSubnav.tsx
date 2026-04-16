import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type PublicSubnavLink = {
  label: string;
  href: string;
  external?: boolean;
};

type PublicSubnavProps = {
  brand: string;
  brandHref: string;
  links: PublicSubnavLink[];
  actions?: ReactNode;
};

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function PublicSubnav({ brand, brandHref, links, actions }: PublicSubnavProps) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "var(--n-nav-h)",
        background: "#000",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.75rem",
        gap: "2rem",
      }}
    >
      {isExternalHref(brandHref) ? (
        <a href={brandHref} style={brandStyle}>
          {brand}
        </a>
      ) : (
        <Link to={brandHref} style={brandStyle}>
          {brand}
        </Link>
      )}

      <nav style={{ display: "flex", alignItems: "center", gap: 0, flex: 1, minWidth: 0, overflowX: "auto" }}>
        {links.map((link) =>
          link.external || isExternalHref(link.href) ? (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {link.label}
            </a>
          ) : (
            <Link key={link.href} to={link.href} style={linkStyle}>
              {link.label}
            </Link>
          ),
        )}
      </nav>

      {actions ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      ) : null}

      <a
        href="https://nerior.store"
        style={{
          fontSize: "0.8125rem",
          color: "rgba(255,255,255,0.4)",
          textDecoration: "none",
          transition: "color 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.color = "rgba(255,255,255,0.4)";
        }}
      >
        nerior.store -&gt;
      </a>
    </header>
  );
}

const brandStyle = {
  fontSize: "0.9375rem",
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "#fff",
  flexShrink: 0,
  textDecoration: "none",
} as const;

const linkStyle = {
  display: "block",
  padding: "0.25rem 0.85rem",
  fontSize: "0.8125rem",
  color: "rgba(255,255,255,0.6)",
  textDecoration: "none",
  transition: "color 0.15s",
  whiteSpace: "nowrap",
} as const;
