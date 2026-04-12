type SidebarItem = {
  key: string;
  label: string;
  iconSrc: string;
  isActive: boolean;
  onClick: () => void;
};

type SidebarProps = {
  activeStripTop: number;
  items: SidebarItem[];
  profileLabel: string;
  isProfileActive: boolean;
  isInstallActive: boolean;
  onProfileClick: () => void;
  onInstallClick: () => void;
};

export function Sidebar({
  activeStripTop,
  items,
  profileLabel,
  isProfileActive,
  isInstallActive,
  onProfileClick,
  onInstallClick,
}: SidebarProps) {
  return (
    <aside className="machines-sidebar" aria-label="Боковая панель">
      <span
        className="machines-sidebar__active-strip"
        aria-hidden="true"
        style={{ transform: `translateY(${activeStripTop}px)` }}
      />
      <div className="machines-logo">
        <img
          src="/logo.png"
          alt="Predict MV logo"
          className="machines-logo__mark"
        />
        <strong>PREDICT MV</strong>
      </div>

      <nav className="machines-nav" aria-label="Навигация">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.isActive ? "machines-nav__item active" : "machines-nav__item"}
            onClick={item.onClick}
          >
            <img
              src={item.iconSrc}
              alt=""
              aria-hidden="true"
              className="machines-nav__icon"
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className={
          isProfileActive
            ? "machines-profile machines-profile--active"
            : "machines-profile"
        }
        onClick={onProfileClick}
      >
        <img src="/imya.png" alt="" aria-hidden="true" />
        <span>{profileLabel}</span>
      </button>

      <button
        type="button"
        className={
          isInstallActive
            ? "machines-profile machines-install machines-profile--active"
            : "machines-profile machines-install"
        }
        onClick={onInstallClick}
      >
        <img src="/download.png" alt="" aria-hidden="true" />
        <span>Установка</span>
      </button>
    </aside>
  );
}
