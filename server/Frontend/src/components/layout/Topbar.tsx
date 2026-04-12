import { MoonStar, Plus, SunMedium } from "lucide-react";

import type { ThemeMode } from "../../app/theme";
import type { AccountNotification } from "../../core/account";
import type { SearchMatch } from "../../core/search";
import { NotificationCenter } from "../profile/NotificationCenter";
import { GlobalSearch } from "../search/GlobalSearch";

type TopbarProps = {
  searchQuery: string;
  searchPlaceholder: string;
  searchResults: SearchMatch[];
  notificationItems: AccountNotification[];
  unreadNotificationCount: number;
  notificationsOpen: boolean;
  themeMode: ThemeMode;
  onSearchChange: (value: string) => void;
  onSelectSearchResult: (result: SearchMatch) => void;
  onToggleNotifications: () => void;
  onOpenNotificationsPage: () => void;
  onOpenNotificationTarget: (href: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onToggleTheme: () => void;
  onCreateTask: () => void;
};

export function Topbar({
  searchQuery,
  searchPlaceholder,
  searchResults,
  notificationItems,
  unreadNotificationCount,
  notificationsOpen,
  themeMode,
  onSearchChange,
  onSelectSearchResult,
  onToggleNotifications,
  onOpenNotificationsPage,
  onOpenNotificationTarget,
  onMarkNotificationRead,
  onToggleTheme,
  onCreateTask,
}: TopbarProps) {
  const isDarkMode = themeMode === "dark";

  return (
    <header className="home-topbar" aria-label="Верхняя панель">
      <GlobalSearch
        query={searchQuery}
        placeholder={searchPlaceholder}
        results={searchResults}
        onQueryChange={onSearchChange}
        onSelectResult={onSelectSearchResult}
      />

      <div className="home-topbar__actions">
        <button
          type="button"
          className="home-theme-toggle"
          aria-label={
            isDarkMode ? "Включить светлую тему" : "Включить тёмную тему"
          }
          onClick={onToggleTheme}
        >
          {isDarkMode ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>

        <NotificationCenter
          items={notificationItems}
          unreadCount={unreadNotificationCount}
          isOpen={notificationsOpen}
          onToggle={onToggleNotifications}
          onOpenAll={onOpenNotificationsPage}
          onNavigate={onOpenNotificationTarget}
          onMarkRead={onMarkNotificationRead}
        />

        <button type="button" className="home-new-task" onClick={onCreateTask}>
          <Plus aria-hidden="true" />
          <span>Создать задачу</span>
        </button>
      </div>
    </header>
  );
}
