import { Plus } from "lucide-react";
import type { SearchMatch } from "../../core/search";
import { GlobalSearch } from "../search/GlobalSearch";

type TopbarProps = {
  searchQuery: string;
  searchPlaceholder: string;
  searchResults: SearchMatch[];
  onSearchChange: (value: string) => void;
  onSelectSearchResult: (result: SearchMatch) => void;
  onCreateTask: () => void;
};

export function Topbar({
  searchQuery,
  searchPlaceholder,
  searchResults,
  onSearchChange,
  onSelectSearchResult,
  onCreateTask,
}: TopbarProps) {
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
          className="home-new-task"
          onClick={onCreateTask}
        >
          <Plus aria-hidden="true" />
          <span>Создать задачу</span>
        </button>
      </div>
    </header>
  );
}
