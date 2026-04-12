import { Search } from "lucide-react";

import type { SearchMatch } from "../../core/search";

const KIND_LABEL: Record<SearchMatch["kind"], string> = {
  menu: "Раздел",
  machine: "Машина",
  task: "Задача",
  result: "Результат",
  access: "Доступ",
  profile: "Профиль",
  api_key: "API ключ",
  report: "Отчёт",
};

type GlobalSearchProps = {
  query: string;
  placeholder: string;
  results: SearchMatch[];
  onQueryChange: (value: string) => void;
  onSelectResult: (result: SearchMatch) => void;
};

export function GlobalSearch({
  query,
  placeholder,
  results,
  onQueryChange,
  onSelectResult,
}: GlobalSearchProps) {
  const isDropdownVisible = query.trim().length > 0 && results.length > 0;

  return (
    <div className="global-search">
      <label className="home-search home-search--workspace" aria-label="Поиск">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>

      {isDropdownVisible ? (
        <div
          className="global-search__dropdown"
          role="listbox"
          aria-label="Результаты поиска"
        >
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className="global-search__result"
              onClick={() => onSelectResult(result)}
            >
              <span className="global-search__result-kind">
                {KIND_LABEL[result.kind]}
              </span>
              <strong>{result.title}</strong>
              {result.subtitle ? (
                <span className="global-search__result-subtitle">
                  {result.subtitle}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
