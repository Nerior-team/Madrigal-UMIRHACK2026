import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";
import type { PublicNavItem } from "../site-content";

type PublicTopbarProps = {
  title: string;
  navItems: PublicNavItem[];
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
};

export function PublicTopbar({
  title,
  navItems,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: PublicTopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function scheduleClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => setActiveDropdown(null), 120);
  }

  function openDropdown(label: string) {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    setActiveDropdown(label);
  }

  function isExternal(href: string): boolean {
    return href.startsWith("http://") || href.startsWith("https://");
  }

  return (
    <>
      {activeDropdown ? <div className="public-topbar__backdrop" onMouseEnter={scheduleClose} /> : null}
      <header className="public-topbar">
        <div className="public-topbar__inner">
          <Link to="/" className="public-topbar__brand">
            {title}
          </Link>

          <button
            type="button"
            className="public-topbar__mobile-trigger"
            onClick={() => setMobileOpen((current) => !current)}
            aria-expanded={mobileOpen}
            aria-label={"\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e"}
          >
            <Menu size={18} />
          </button>

          <nav className={mobileOpen ? "public-topbar__nav is-open" : "public-topbar__nav"}>
            {navItems.map((item) => (
              <div
                key={item.label}
                className="public-nav-item"
                onMouseEnter={() => (item.menu?.length ? openDropdown(item.label) : setActiveDropdown(null))}
                onMouseLeave={item.menu?.length ? scheduleClose : undefined}
              >
                {isExternal(item.href) ? (
                  <a href={item.href} className="public-nav-item__link">
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <NavLink to={item.href} className="public-nav-item__link">
                    <span>{item.label}</span>
                  </NavLink>
                )}

                {item.menu?.length ? (
                  <div
                    className={activeDropdown === item.label ? "public-mega-menu is-open" : "public-mega-menu"}
                    role="menu"
                    aria-label={item.label}
                    onMouseEnter={() => openDropdown(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="public-mega-menu__label">
                      {item.label === "\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b"
                        ? "\u0418\u0437\u0443\u0447\u0438\u0442\u044c \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b"
                        : "\u0418\u0437\u0443\u0447\u0438\u0442\u044c \u0440\u0430\u0437\u0434\u0435\u043b"}
                    </div>
                    <div className="public-mega-menu__items">
                      {item.menu.map((menuItem) =>
                        menuItem.disabled ? (
                          <div key={menuItem.label} className="public-mega-menu__entry is-disabled">
                            <span>{menuItem.label}</span>
                            {menuItem.note ? <small>{menuItem.note}</small> : null}
                          </div>
                        ) : (
                          <a key={menuItem.label} href={menuItem.href} className="public-mega-menu__entry">
                            <span>{menuItem.label}</span>
                            {menuItem.note ? <small>{menuItem.note}</small> : null}
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="public-topbar__actions">
            <a href={secondaryActionHref} className="public-button public-button--ghost">
              <span>{secondaryActionLabel}</span>
              <ChevronRight size={16} />
            </a>
            <a href={primaryActionHref} className="public-button public-button--solid">
              <span>{primaryActionLabel}</span>
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
