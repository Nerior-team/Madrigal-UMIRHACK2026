import { useState } from "react";
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

  function isExternal(href: string): boolean {
    return href.startsWith("http://") || href.startsWith("https://");
  }

  return (
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
          aria-label="Открыть меню"
        >
          <Menu size={18} />
        </button>

        <nav className={mobileOpen ? "public-topbar__nav is-open" : "public-topbar__nav"}>
          {navItems.map((item) => (
            <div key={item.label} className="public-nav-item">
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
                <div className="public-mega-menu" role="menu" aria-label={item.label}>
                  <div className="public-mega-menu__label">
                    {item.label === "Продукты" ? "Изучить продукты" : "Изучить раздел"}
                  </div>
                  <div className="public-mega-menu__items">
                    {item.menu.map((menuItem) =>
                      menuItem.disabled ? (
                        <div key={menuItem.label} className="public-mega-menu__entry is-disabled">
                          <span>{menuItem.label}</span>
                        </div>
                      ) : (
                        <a key={menuItem.label} href={menuItem.href} className="public-mega-menu__entry">
                          <span>{menuItem.label}</span>
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
  );
}
