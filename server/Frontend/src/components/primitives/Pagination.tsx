import { getPaginationState } from "../../core/pagination";

type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  totalItems,
  onChange,
}: PaginationProps) {
  const state = getPaginationState({ page, pageSize, totalItems });

  if (state.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Пагинация">
      <button
        type="button"
        className="pagination__button"
        disabled={!state.hasPreviousPage}
        onClick={() => onChange(state.page - 1)}
      >
        Назад
      </button>

      <div className="pagination__pages">
        {state.visiblePages.map((visiblePage) => (
          <button
            key={visiblePage}
            type="button"
            className={
              visiblePage === state.page
                ? "pagination__page pagination__page--active"
                : "pagination__page"
            }
            onClick={() => onChange(visiblePage)}
          >
            {visiblePage}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pagination__button"
        disabled={!state.hasNextPage}
        onClick={() => onChange(state.page + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}
