import type { MachineWorkspaceResult } from "./types";

type MachineResultsPanelProps = {
  results: MachineWorkspaceResult[];
  onOpenResults: () => void;
  onOpenResultDetail: (resultId: string) => void;
  onOpenTaskLogs: (taskId: string) => void;
};

export function MachineResultsPanel({
  results,
  onOpenResults,
  onOpenResultDetail,
  onOpenTaskLogs,
}: MachineResultsPanelProps) {
  return (
    <section className="machine-details__panel">
      <header className="machine-details__section-head">
        <h2>Результаты</h2>
        <button
          type="button"
          className="machine-details__link-button"
          onClick={onOpenResults}
        >
          Смотреть все
        </button>
      </header>

      <div className="machine-details__table-wrap">
        <table className="results-table-card__grid">
          <thead>
            <tr>
              <th>Название</th>
              <th>Статус</th>
              <th>Команда</th>
              <th>Дата результата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {results.length ? (
              results.slice(0, 4).map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      type="button"
                      className="results-actions__details"
                      onClick={() => onOpenResultDetail(row.id)}
                    >
                      {row.title}
                    </button>
                  </td>
                  <td>
                    <span
                      className={`results-status results-status--${row.statusTone}`}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td>
                    <span className="results-command">{row.command}</span>
                  </td>
                  <td>{row.resultAt}</td>
                  <td>
                    <button
                      type="button"
                      className="results-actions__logs"
                      onClick={() => onOpenTaskLogs(row.taskId)}
                    >
                      Посмотреть логи
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Нет результатов по этой машине</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
