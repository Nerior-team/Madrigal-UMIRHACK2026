import { LogsConsolePanel } from "./LogsConsolePanel";
import type { LogsWorkspaceFilterTone, LogsWorkspaceProps } from "./types";

export type { LogsWorkspaceProps } from "./types";

const FILTER_LABELS: Array<{
  value: LogsWorkspaceFilterTone;
  label: string;
  countKey?: "success" | "warning" | "critical";
}> = [
  { value: "all", label: "Все" },
  { value: "success", label: "Завершено", countKey: "success" },
  { value: "warning", label: "Требует внимания", countKey: "warning" },
  { value: "critical", label: "Критично", countKey: "critical" },
];

export function LogsWorkspace({
  scopeSummary,
  filterTone,
  statusStats,
  totalEntries,
  totalStreamItems,
  autoScrollEnabled,
  entries,
  streamItems,
  onFilterToneChange,
  onToggleAutoScroll,
  onOpenTaskLogs,
}: LogsWorkspaceProps) {
  return (
    <section className="logs-dashboard" aria-label="Логи">
      <div className="logs-dashboard__body">
        <header className="logs-dashboard__header">
          <div>
            <h1>Логи</h1>
            <p>{scopeSummary}</p>
          </div>
        </header>

        <div className="logs-dashboard__filters">
          <div className="logs-dashboard__chips">
            {FILTER_LABELS.map((filter) => {
              const count =
                filter.value === "all"
                  ? totalEntries
                  : statusStats[filter.countKey ?? "success"];

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`logs-dashboard__chip ${
                    filterTone === filter.value
                      ? "logs-dashboard__chip--active"
                      : ""
                  }`}
                  onClick={() => onFilterToneChange(filter.value)}
                >
                  {`${filter.label} (${count})`}
                </button>
              );
            })}
          </div>

          <span className="logs-dashboard__search-note">
            Поиск выполняется через верхнюю панель
          </span>
        </div>

        <div className="logs-dashboard__content">
          <section className="logs-table" aria-label="Таблица логов">
            <table className="logs-table__grid">
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Машина</th>
                  <th>Пользователь</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {entries.length ? (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className="logs-table__task">
                          <strong>{entry.taskTitle}</strong>
                          <span>{entry.action}</span>
                        </div>
                      </td>
                      <td>{entry.machine}</td>
                      <td>{entry.email}</td>
                      <td>
                        <span
                          className={`logs-table__status logs-table__status--${entry.tone}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td>{entry.createdAt}</td>
                      <td>
                        <button
                          type="button"
                          className="logs-table__details"
                          onClick={() =>
                            onOpenTaskLogs(entry.taskId, entry.machineId)
                          }
                        >
                          К деталям
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="logs-table__empty">
                      По текущим фильтрам нет логов.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="logs-table__footer">
              <span>
                Показано {entries.length} из {totalEntries}
              </span>
              <span>Событий в потоке: {totalStreamItems}</span>
            </footer>
          </section>

          <LogsConsolePanel
            autoScrollEnabled={autoScrollEnabled}
            streamItems={streamItems}
            onToggleAutoScroll={onToggleAutoScroll}
          />
        </div>
      </div>
    </section>
  );
}
