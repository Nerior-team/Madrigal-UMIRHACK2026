import type { ReactNode } from "react";

import type { ProfileSectionKey } from "./types";

const PROFILE_SECTIONS: Array<{
  key: Exclude<ProfileSectionKey, "api-keys">;
  label: string;
}> = [
  { key: "general", label: "Профиль" },
  { key: "security", label: "Безопасность" },
  { key: "sessions", label: "Активные сессии" },
  { key: "notifications", label: "Уведомления" },
];

type ProfileWorkspaceProps = {
  activeSection: ProfileSectionKey;
  onNavigateSection: (section: ProfileSectionKey) => void;
  children: ReactNode;
};

export function ProfileWorkspace({
  activeSection,
  onNavigateSection,
  children,
}: ProfileWorkspaceProps) {
  return (
    <section className="profile-dashboard" aria-label="Профиль">
      <div className="profile-dashboard__body">
        <aside className="profile-nav" aria-label="Разделы профиля">
          <h2>Профиль</h2>
          <div className="profile-nav__items">
            {PROFILE_SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                className={
                  activeSection === section.key
                    ? "profile-nav__item profile-nav__item--active"
                    : "profile-nav__item"
                }
                onClick={() => onNavigateSection(section.key)}
              >
                {section.label}
              </button>
            ))}
            <button
              type="button"
              className={
                activeSection === "api-keys"
                  ? "profile-nav__item profile-nav__item--active"
                  : "profile-nav__item"
              }
              onClick={() => onNavigateSection("api-keys")}
            >
              API-ключи
            </button>
          </div>
        </aside>

        <div className="profile-main">{children}</div>
      </div>
    </section>
  );
}
