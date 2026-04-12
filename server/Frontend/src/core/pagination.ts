export type PaginationOptions = {
  page: number;
  pageSize: number;
  totalItems: number;
  windowSize?: number;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startIndex: number;
  endIndex: number;
  visiblePages: number[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getPaginationState({
  page,
  pageSize,
  totalItems,
  windowSize = 5,
}: PaginationOptions): PaginationState {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = clamp(page, 1, totalPages);
  const safeWindowSize = Math.max(1, windowSize);
  const halfWindow = Math.floor(safeWindowSize / 2);

  let startPage = Math.max(1, currentPage - halfWindow);
  let endPage = Math.min(totalPages, startPage + safeWindowSize - 1);

  if (endPage - startPage + 1 < safeWindowSize) {
    startPage = Math.max(1, endPage - safeWindowSize + 1);
  }

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * safePageSize;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(totalItems, startIndex + safePageSize);

  return {
    page: currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    startIndex,
    endIndex,
    visiblePages,
  };
}
