const MOSCOW_TIME_ZONE = "Europe/Moscow";

export function normalizeMachineTitle(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "Нет данных";

  if (/^linux\b/i.test(normalized) && /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.test(normalized)) {
    return "Linux";
  }

  return normalized;
}

export function normalizeMachineOsLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Нет данных";

  if (/^linux\b/i.test(normalized)) {
    return "Linux";
  }

  return normalized.replace(/\s+/g, " ");
}

export function formatMoscowDateTime(value?: string | null): string {
  if (!value) return "Нет данных";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MOSCOW_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function matchesSearchQuery(
  query: string,
  values: Array<string | number | null | undefined>,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
