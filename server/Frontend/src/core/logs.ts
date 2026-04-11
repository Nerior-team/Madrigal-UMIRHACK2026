import { formatMoscowDateTime } from "./ui";

export function formatLogStreamLine(input: {
  kind: "request" | "response";
  createdAt: string;
  machine: string;
  text: string;
}): string {
  const prefix =
    input.kind === "request" ? "Отправленная задача" : "Ответ";

  return `${prefix} (${formatMoscowDateTime(input.createdAt)} ${input.machine}): ${input.text}`;
}

export function buildLogsScopeSummary(input: {
  machine: string | null;
  taskTitle: string | null;
}): string {
  if (input.machine && input.taskTitle) {
    return `Логи задачи "${input.taskTitle}" по машине ${input.machine}`;
  }

  if (input.machine) {
    return `Логи машины ${input.machine}`;
  }

  if (input.taskTitle) {
    return `Логи задачи "${input.taskTitle}"`;
  }

  return "История системных событий по задачам и машинам";
}
