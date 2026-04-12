const MOSCOW_TIME_ZONE = "Europe/Moscow";
const HEARTBEAT_STALE_MINUTES = 5;
const EMPTY_LABEL = "Нет данных";

export type BackendMachineActivityStatus = "pending" | "online" | "offline";
export type MachineActivityStatus =
  | "online"
  | "running"
  | "offline"
  | "deleted";

export function normalizeMachineTitle(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return EMPTY_LABEL;

  if (
    /^linux\b/i.test(normalized) &&
    /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.test(normalized)
  ) {
    return "Linux";
  }

  return normalized;
}

export function normalizeMachineOsLabel(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return EMPTY_LABEL;

  if (/^linux\b/i.test(normalized)) {
    return "Linux";
  }

  return normalized;
}

export function formatMoscowDateTime(value?: string | null): string {
  if (!value) return EMPTY_LABEL;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_LABEL;

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MOSCOW_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMachineHeartbeatLabel(input: {
  lastHeartbeatAt?: string | null;
  unpairedAt?: string | null;
}): string {
  if (input.unpairedAt) {
    return `Отвязана ${formatMoscowDateTime(input.unpairedAt)}`;
  }

  return formatMoscowDateTime(input.lastHeartbeatAt);
}

export function isHeartbeatFresh(
  value?: string | null,
  now = new Date(),
  staleMinutes = HEARTBEAT_STALE_MINUTES,
): boolean {
  if (!value) return false;

  const heartbeatDate = new Date(value);
  if (Number.isNaN(heartbeatDate.getTime())) return false;

  return now.getTime() - heartbeatDate.getTime() <= staleMinutes * 60 * 1000;
}

export function resolveMachineActivityStatus(input: {
  backendStatus: BackendMachineActivityStatus;
  lastHeartbeatAt?: string | null;
  unpairedAt?: string | null;
  hasActiveTask: boolean;
  now?: Date;
}): MachineActivityStatus {
  if (input.unpairedAt) {
    return "deleted";
  }

  const isFresh = isHeartbeatFresh(input.lastHeartbeatAt, input.now);

  if (!isFresh || input.backendStatus === "offline") {
    return "offline";
  }

  if (input.hasActiveTask) {
    return "running";
  }

  return "online";
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
