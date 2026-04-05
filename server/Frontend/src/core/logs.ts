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
