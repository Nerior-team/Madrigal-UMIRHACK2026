import { useEffect, useMemo, useState } from "react";

import { Pagination } from "../../primitives/Pagination";
import { LogsConsolePanel } from "./LogsConsolePanel";
import type { LogsWorkspaceFilterTone, LogsWorkspaceProps } from "./types";

export type { LogsWorkspaceProps } from "./types";

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [entries, filterTone, scopeSummary]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedEntries = useMemo(
    () => entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [entries, safePage],
  );

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
            Глобальный поиск находится в верхней панели и учитывает машины,
            задачи, результаты и пункты меню.
          </span>
        </div>

        <div className="logs-dashboard__content">
          <section className="logs-table" aria-label="Журнал задач">
            <div className="logs-table__summary">
              <strong>{scopeSummary}</strong>
              <span>Консоль привязана к конкретной задаче и выбранной машине.</span>
            </div>

            <div className="logs-table__wrap">
              <table className="logs-table__grid">
                <thead>
                  <tr>
                    <th>Задача</th>
                    <th>Машина</th>
                    <th>Пользователь</th>
                    <th>Состояние</th>
                    <th>Когда</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEntries.length ? (
                    pagedEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <div className="logs-table__task">
                            <strong className="logs-table__task-title">
                              {entry.taskTitle}
                            </strong>
                            <code className="logs-table__command">
                              {entry.renderedCommand}
                            </code>
                            <span className="logs-table__task-action">
                              {entry.action}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="logs-table__context">{entry.machine}</span>
                        </td>
                        <td>
                          <span className="logs-table__email">{entry.email}</span>
                        </td>
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
                            Открыть консоль
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="logs-table__empty">
                        По текущим фильтрам записей не найдено.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="logs-table__footer">
              <span>{`Показано ${pagedEntries.length} из ${entries.length}`}</span>
              <span>{`Строк в консоли: ${totalStreamItems}`}</span>
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                totalItems={entries.length}
                onChange={setPage}
              />
            </footer>
          </section>

          <LogsConsolePanel
            autoScrollEnabled={autoScrollEnabled}
            scopeSummary={scopeSummary}
            streamItems={streamItems}
            onToggleAutoScroll={onToggleAutoScroll}
          />
        </div>
      </div>
    </section>
  );
}
