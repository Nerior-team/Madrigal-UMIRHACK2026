import { OperationConsole } from "../console/OperationConsole";
import type { LogsWorkspaceProps } from "./types";

type LogsConsolePanelProps = Pick<
  LogsWorkspaceProps,
  "autoScrollEnabled" | "scopeSummary" | "streamItems" | "onToggleAutoScroll"
>;

export function LogsConsolePanel({
  autoScrollEnabled,
  scopeSummary,
  streamItems,
  onToggleAutoScroll,
}: LogsConsolePanelProps) {
  const lines = streamItems.map((item) => ({
    id: item.id,
    tone: item.kind === "request" ? "command" : "stdout",
    label: item.kind === "request" ? item.machine : "stdout",
    timestamp: item.createdAt,
    text: item.text,
  })) as Array<{
    id: string;
    tone: "command" | "stdout";
    label: string;
    timestamp: string;
    text: string;
  }>;

  return (
    <aside className="logs-stream" aria-label="Консоль логов">
      <OperationConsole
        title="Консоль задачи"
        subtitle={scopeSummary}
        lines={lines}
        live
        emptyMessage="Для выбранной задачи консольный вывод пока не поступил."
        actions={
          <button
            type="button"
            className={
              autoScrollEnabled
                ? "logs-stream__toggle logs-stream__toggle--active"
                : "logs-stream__toggle"
            }
            onClick={onToggleAutoScroll}
          >
            {autoScrollEnabled
              ? "Автопрокрутка включена"
              : "Автопрокрутка выключена"}
          </button>
        }
      />
    </aside>
  );
}
