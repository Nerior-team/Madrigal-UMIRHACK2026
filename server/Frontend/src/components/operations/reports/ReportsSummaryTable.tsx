import { Pagination } from "../../primitives/Pagination";
import type { ReportSummaryRow } from "./types";
import { formatDurationCompact, getReportTemplateIcon } from "./report-utils";

type ReportsSummaryTableProps = {
  rows: ReportSummaryRow[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAction: (row: ReportSummaryRow) => void;
};

export function ReportsSummaryTable({
  rows,
  page,
  pageSize,
  onPageChange,
  onAction,
}: ReportsSummaryTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="reports-table-card">
      <header className="reports-table-card__header">
        <div>
          <h2>Сводка по шаблонам</h2>
          <span className="reports-table-card__caption">
            Drill-down использует те же реальные данные, что и задачи,
            результаты и логи.
          </span>
        </div>
      </header>

      {rows.length ? (
        <>
          <table className="reports-table-card__grid">
            <thead>
              <tr>
                <th>Шаблон или задача</th>
                <th>Всего задач</th>
                <th>Успешно</th>
                <th>Ошибки</th>
                <th>Средняя длительность</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="reports-table-card__template">
                      <img
                        src={getReportTemplateIcon(row.title)}
                        className={
                          row.title.trim().toLowerCase() === "db-sync"
                            ? "reports-table-card__template-icon--sync"
                            : undefined
                        }
                        alt=""
                        aria-hidden="true"
                      />
                      <span>{row.title}</span>
                    </span>
                  </td>
                  <td>{row.totalTasks}</td>
                  <td className="reports-table-card__success">
                    {row.successCount}
                  </td>
                  <td className="reports-table-card__error">
                    {row.errorCount}
                  </td>
                  <td>{formatDurationCompact(row.avgDurationMs)}</td>
                  <td>
                    <button
                      type="button"
                      className="reports-table-card__action"
                      onClick={() => onAction(row)}
                    >
                      {row.actionLabel}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="reports-table-card__footer">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              totalItems={rows.length}
              onChange={onPageChange}
            />
          </div>
        </>
      ) : (
        <div className="reports-table-card__empty">
          <p>Нет данных для выбранных фильтров.</p>
        </div>
      )}
    </section>
  );
}
