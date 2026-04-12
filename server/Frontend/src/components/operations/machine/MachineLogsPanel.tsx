import type { MachineWorkspaceLog } from "./types";

type MachineLogsPanelProps = {
  isActive?: boolean;
  logs: MachineWorkspaceLog[];
  onOpenLogs: () => void;
  onOpenTaskLogs: (taskId: string) => void;
};

export function MachineLogsPanel({
  isActive = false,
  logs,
  onOpenLogs,
  onOpenTaskLogs,
}: MachineLogsPanelProps) {
  return (
    <section
      className={`machine-details__panel${
        isActive ? " machine-details__panel--active" : ""
      }`}
      data-testid="machine-logs-section"
    >
      <header className="machine-details__section-head">
        <div>
          <h2>Логи</h2>
          <p className="machine-details__section-note">
            История команд по этой машине и быстрый переход к консоли конкретной
            задачи.
          </p>
        </div>
        <button
          type="button"
          className="machine-details__link-button"
          onClick={onOpenLogs}
        >
          Смотреть все
        </button>
      </header>

      <div className="machine-details__table-wrap">
        <table className="logs-table__grid">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Пользователь</th>
              <th>Состояние</th>
              <th>Когда</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.slice(0, 4).map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="logs-table__task">
                      <strong className="logs-table__task-title">
                        {entry.taskTitle}
                      </strong>
                      <span className="logs-table__task-action">
                        {entry.action}
                      </span>
                    </div>
                  </td>
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
                      onClick={() => onOpenTaskLogs(entry.taskId)}
                    >
                      Посмотреть логи
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>По этой машине логов пока нет.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
