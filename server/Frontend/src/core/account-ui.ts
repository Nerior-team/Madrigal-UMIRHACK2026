import type {
  AccountSession,
  ApiKeyExpiryPreset,
  ApiKeyPermission,
  DeletedMachineRetention,
  NotificationLevel,
  NotificationTopic,
  SessionKind,
} from "./account";
import { formatMoscowDateTime } from "./ui";

const RETENTION_LABELS: Record<DeletedMachineRetention, string> = {
  none: "Не хранить",
  week: "1 неделя",
  month: "1 месяц",
  three_months: "3 месяца",
  six_months: "6 месяцев",
  year: "1 год",
  forever: "Не удалять",
};

const TOPIC_LABELS: Record<NotificationTopic, string> = {
  tasks: "Задачи",
  warnings: "Предупреждения",
  reports: "Отчеты",
  security: "Безопасность",
};

const LEVEL_LABELS: Record<NotificationLevel, string> = {
  info: "Информация",
  success: "Успех",
  warning: "Внимание",
  error: "Ошибка",
};

const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  web: "Браузер",
  desktop: "Desktop",
  cli: "CLI",
};

const API_KEY_PERMISSION_LABELS: Record<ApiKeyPermission, string> = {
  read: "Только чтение",
  run: "Чтение и запуск",
};

const API_KEY_EXPIRY_LABELS: Record<ApiKeyExpiryPreset, string> = {
  one_time: "Одноразовый",
  day: "1 день",
  week: "1 неделя",
  month: "1 месяц",
  year: "1 год",
  unlimited: "Без срока",
};

export function getRetentionOptions(): Array<{
  value: DeletedMachineRetention;
  label: string;
}> {
  return Object.entries(RETENTION_LABELS).map(([value, label]) => ({
    value: value as DeletedMachineRetention,
    label,
  }));
}

export function getRetentionLabel(value: DeletedMachineRetention): string {
  return RETENTION_LABELS[value];
}

export function getNotificationTopicLabel(topic: NotificationTopic): string {
  return TOPIC_LABELS[topic];
}

export function getNotificationLevelLabel(level: NotificationLevel): string {
  return LEVEL_LABELS[level];
}

export function getSessionKindLabel(sessionKind: SessionKind): string {
  return SESSION_KIND_LABELS[sessionKind];
}

export function getApiKeyPermissionLabel(permission: ApiKeyPermission): string {
  return API_KEY_PERMISSION_LABELS[permission];
}

export function getApiKeyExpiryLabel(expiry: ApiKeyExpiryPreset): string {
  return API_KEY_EXPIRY_LABELS[expiry];
}

export function summarizeSession(session: AccountSession): string {
  const parts = [
    session.ipAddress?.trim(),
    session.userAgent?.trim(),
    `Выдана ${formatMoscowDateTime(session.issuedAt)}`,
  ].filter(Boolean);

  return parts.join(" • ");
}

export function getSessionRestrictionLabel(
  session: AccountSession,
): string | null {
  if (session.canBeRevoked) {
    return null;
  }

  if (!session.revokeRestrictedUntil) {
    return "Эту сессию пока нельзя завершить с нового устройства.";
  }

  return `Доступно после ${formatMoscowDateTime(session.revokeRestrictedUntil)}.`;
}

export function validatePasswordPolicy(password: string): string[] {
  const issues: string[] = [];

  if (password.length < 12) issues.push("Не менее 12 символов.");
  if (password.length > 128) issues.push("Не более 128 символов.");
  if (/\s/.test(password)) issues.push("Пароль не должен содержать пробелы.");
  if (!/[a-zа-яё]/.test(password)) issues.push("Добавьте строчную букву.");
  if (!/[A-ZА-ЯЁ]/.test(password)) issues.push("Добавьте заглавную букву.");
  if (!/\d/.test(password)) issues.push("Добавьте цифру.");
  if (!/[^A-Za-zА-Яа-яЁё0-9\s]/.test(password)) {
    issues.push("Добавьте специальный символ.");
  }

  return issues;
}
