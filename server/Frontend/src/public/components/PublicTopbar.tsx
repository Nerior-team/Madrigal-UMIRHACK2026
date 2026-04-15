import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicNavItem } from "../site-content";

type PublicTopbarProps = {
  title: string;
  navItems: PublicNavItem[];
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
};

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function PublicTopbar({
  title,
  navItems,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: PublicTopbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  function openDropdown(label: string) {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    setActiveDropdown(label);
  }

  function scheduleClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => setActiveDropdown(null), 120);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const activeItem = navItems.find((item) => item.label === activeDropdown);

  return (
    <>
      {activeDropdown ? (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 30, backdropFilter: "none" }}
          onMouseEnter={scheduleClose}
        />
      ) : null}

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "var(--n-nav-h)",
          background: "#000",
          borderBottom: activeDropdown ? "none" : "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          paddingLeft: "1.75rem",
          paddingRight: "1.75rem",
          gap: "2rem",
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#fff",
            flexShrink: 0,
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          {title}
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }}>
          {navItems.map((item) => (
            <div
              key={item.label}
              style={{ position: "relative" }}
              onMouseEnter={() => (item.menu?.length ? openDropdown(item.label) : setActiveDropdown(null))}
              onMouseLeave={item.menu?.length ? scheduleClose : undefined}
            >
              {isExternalHref(item.href) ? (
                <a href={item.href} style={navLinkStyle}>
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  style={navLinkStyle}
                  onMouseEnter={() => {
                    if (item.menu?.length) {
                      openDropdown(item.label);
                    }
                  }}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <a
            href={secondaryActionHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.375rem 1rem",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "999px",
              fontSize: "0.8125rem",
              color: "#fff",
              whiteSpace: "nowrap",
              textDecoration: "none",
              transition: "border-color 0.18s, background 0.18s",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            {secondaryActionLabel}
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>››</span>
          </a>
          <a
            href={primaryActionHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.375rem 1rem",
              background: "#fff",
              borderRadius: "999px",
              fontSize: "0.8125rem",
              color: "#000",
              fontWeight: 500,
              whiteSpace: "nowrap",
              textDecoration: "none",
              transition: "background 0.18s, color 0.18s",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "#e8e8e8";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "#fff";
            }}
          >
            {primaryActionLabel}
            <span style={{ fontSize: "0.7rem" }}>↗</span>
          </a>
        </div>
      </header>

      {activeItem?.menu?.length ? (
        <div
          style={{
            position: "fixed",
            top: "var(--n-nav-h)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "#000",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "1.25rem 1.75rem 1.5rem",
            animation: "neriorDropdownIn 0.18s ease",
          }}
          onMouseEnter={() => {
            if (closeTimer.current !== null) {
              window.clearTimeout(closeTimer.current);
            }
          }}
          onMouseLeave={scheduleClose}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
              marginTop: 0,
            }}
          >
            {activeItem.label === "Продукты" ? "Изучить продукты" : "Изучить раздел"}
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {activeItem.menu.map((menuItem) => (
              <li key={menuItem.label}>
                {menuItem.disabled ? (
                  <span
                    style={{
                      display: "block",
                      fontSize: "1.0625rem",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.38)",
                      lineHeight: 1.4,
                    }}
                  >
                    {menuItem.label}
                  </span>
                ) : isExternalHref(menuItem.href) ? (
                  <a
                    href={menuItem.href}
                    style={dropdownLinkStyle}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    }}
                  >
                    {menuItem.label}
                  </a>
                ) : (
                  <Link
                    to={menuItem.href}
                    style={dropdownLinkStyle}
                    onClick={() => setActiveDropdown(null)}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    }}
                  >
                    {menuItem.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <style>{`
        @keyframes neriorDropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const navLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "0.25rem 0.85rem",
  fontSize: "0.8125rem",
  color: "rgba(255,255,255,0.75)",
  background: "none",
  border: "none",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "color 0.15s",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

const dropdownLinkStyle: React.CSSProperties = {
  display: "block",
  fontSize: "1.0625rem",
  fontWeight: 400,
  color: "rgba(255,255,255,0.75)",
  transition: "color 0.15s",
  lineHeight: 1.4,
  textDecoration: "none",
};
