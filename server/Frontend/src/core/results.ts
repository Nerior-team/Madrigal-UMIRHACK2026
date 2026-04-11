import { matchesSearchQuery } from "./ui";

export type ResultStatusTone = "success" | "error" | "cancelled" | "pending";

export type ResultRowLike = {
  id: string;
  taskId?: string;
  machineId?: string;
  title: string;
  statusTone: ResultStatusTone;
  statusLabel: string;
  machine: string;
  command: string;
  resultAt: string;
  resultAtIso: string;
};

export type ResultDateRange = {
  from: string;
  to: string;
};

export type ResultFilters = {
  status: "all" | ResultStatusTone;
  machine: string;
  command: string;
  searchQuery: string;
  dateRange: ResultDateRange;
};

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

function formatDateInputValue(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}

function getRangeStart(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRangeEnd(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildResultsFilterOptions<T extends Pick<ResultRowLike, "machine" | "command">>(
  rows: T[],
): {
  machineOptions: SelectOption[];
  commandOptions: SelectOption[];
} {
  const machineOptions = [
    { value: "all", label: "Все машины" },
    ...[...new Set(rows.map((row) => row.machine))]
      .sort((left, right) => left.localeCompare(right, "ru"))
      .map((value) => ({ value, label: value })),
  ];

  const commandOptions = [
    { value: "all", label: "Все команды" },
    ...[...new Set(rows.map((row) => row.command))]
      .sort((left, right) => left.localeCompare(right, "ru"))
      .map((value) => ({ value, label: value })),
  ];

  return { machineOptions, commandOptions };
}

export function filterResultRows<T extends ResultRowLike>(
  rows: T[],
  filters: ResultFilters,
): T[] {
  const rangeStart = getRangeStart(filters.dateRange.from);
  const rangeEnd = getRangeEnd(filters.dateRange.to);

  return rows.filter((row) => {
    const rowDate = new Date(row.resultAtIso);
    const byStatus =
      filters.status === "all" || row.statusTone === filters.status;
    const byMachine =
      filters.machine === "all" || row.machine === filters.machine;
    const byCommand =
      filters.command === "all" || row.command === filters.command;
    const bySearch = matchesSearchQuery(filters.searchQuery, [
      row.title,
      row.machine,
      row.command,
      row.resultAt,
      row.statusLabel,
    ]);
    const byRange =
      !Number.isNaN(rowDate.getTime()) &&
      (!rangeStart || rowDate >= rangeStart) &&
      (!rangeEnd || rowDate <= rangeEnd);

    return byStatus && byMachine && byCommand && bySearch && byRange;
  });
}

export function formatResultDateRangeLabel(range: ResultDateRange): string {
  if (!range.from && !range.to) {
    return "Выберите срок";
  }

  if (range.from && range.to) {
    return `${formatDateInputValue(range.from)} - ${formatDateInputValue(range.to)}`;
  }

  if (range.from) {
    return `От ${formatDateInputValue(range.from)}`;
  }

  return `До ${formatDateInputValue(range.to)}`;
}
