import { formatLogStreamLine } from "../../../core/logs";
import type { LogsWorkspaceProps } from "./types";

type LogsConsolePanelProps = Pick<
  LogsWorkspaceProps,
  "autoScrollEnabled" | "streamItems" | "onToggleAutoScroll"
>;

export function LogsConsolePanel({
  autoScrollEnabled,
  streamItems,
  onToggleAutoScroll,
}: LogsConsolePanelProps) {
  return (
    <aside className="logs-stream" aria-label="Консоль логов">
      <header className="logs-stream__header">
        <div className="logs-stream__title-block">
          <h2>Консоль</h2>
          <p>Поток выполнения по текущим фильтрам</p>
        </div>
        <button
          type="button"
          className={
            autoScrollEnabled
              ? "logs-stream__toggle logs-stream__toggle--active"
              : "logs-stream__toggle"
          }
          onClick={onToggleAutoScroll}
        >
          {autoScrollEnabled ? "Автопрокрутка: вкл" : "Автопрокрутка: выкл"}
        </button>
      </header>

      <div className="logs-stream__console" role="log" aria-live="polite">
        {streamItems.length ? (
          streamItems.map((item) => (
            <pre key={item.id} className="logs-stream__console-line">
              {formatLogStreamLine({
                kind: item.kind,
                createdAt: item.createdAt,
                machine: item.machine,
                text: item.text,
              })}
            </pre>
          ))
        ) : (
          <p className="logs-stream__empty">
            По текущим фильтрам нет консольного вывода.
          </p>
        )}
      </div>
    </aside>
  );
}
