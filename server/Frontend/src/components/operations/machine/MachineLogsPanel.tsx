import type { MachineWorkspaceLog } from "./types";

type MachineLogsPanelProps = {
  logs: MachineWorkspaceLog[];
  onOpenLogs: () => void;
  onOpenTaskLogs: (taskId: string) => void;
};

export function MachineLogsPanel({
  logs,
  onOpenLogs,
  onOpenTaskLogs,
}: MachineLogsPanelProps) {
  return (
    <section className="machine-details__panel">
      <header className="machine-details__section-head">
        <h2>Логи</h2>
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
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.slice(0, 4).map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="logs-table__task">
                      <strong>{entry.taskTitle}</strong>
                      <span>{entry.action}</span>
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
                      К деталям
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Нет логов по этой машине</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
