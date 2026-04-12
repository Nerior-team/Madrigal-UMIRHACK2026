import { useEffect, useState } from "react";

import type { ResultsDashboardResponse } from "../../../core";
import { EmptyState } from "../../primitives/EmptyState";
import { Pagination } from "../../primitives/Pagination";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../primitives/CustomSelect";
import {
  formatResultDateRangeLabel,
  type ResultDateRange,
  type ResultStatusTone,
} from "../../../core/results";

const STATUS_OPTIONS: Array<CustomSelectOption<"all" | ResultStatusTone>> = [
  { value: "all", label: "Все" },
  { value: "success", label: "Выполнено" },
  { value: "error", label: "Ошибка" },
  { value: "cancelled", label: "Отменено" },
  { value: "pending", label: "Ожидает" },
];

const PAGE_SIZE = 10;

type ResultRow = ResultsDashboardResponse["rows"][number];

export type ResultsWorkspaceProps = {
  rows: ResultRow[];
  totalItems: number;
  statusValue: "all" | ResultStatusTone;
  machineValue: string;
  commandValue: string;
  dateRange: ResultDateRange;
  machineOptions: Array<CustomSelectOption<string>>;
  commandOptions: Array<CustomSelectOption<string>>;
  onStatusChange: (value: "all" | ResultStatusTone) => void;
  onMachineChange: (value: string) => void;
  onCommandChange: (value: string) => void;
  onDateRangeChange: (range: ResultDateRange) => void;
  onOpenLogs: (taskId: string, machineId: string) => void;
  onOpenResultDetail: (resultId: string, machineId: string) => void;
};

export function ResultsWorkspace({
  rows,
  totalItems,
  statusValue,
  machineValue,
  commandValue,
  dateRange,
  machineOptions,
  commandOptions,
  onStatusChange,
  onMachineChange,
  onCommandChange,
  onDateRangeChange,
  onOpenLogs,
  onOpenResultDetail,
}: ResultsWorkspaceProps) {
  const [page, setPage] = useState(1);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<ResultDateRange>(dateRange);

  useEffect(() => {
    setDraftRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [rows, statusValue, machineValue, commandValue, dateRange]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="results-dashboard__body">
      <header className="results-dashboard__header">
        <div className="results-dashboard__title-box">
          <h1>Результаты</h1>
          <p>{`Всего ${totalItems}`}</p>
        </div>
      </header>

      <div className="results-dashboard__filters">
        <label className="results-filter-field">
          <span>Статус</span>
          <CustomSelect
            value={statusValue}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
            ariaLabel="Фильтр результатов по статусу"
            className="results-filter results-filter--status"
          />
        </label>

        <label className="results-filter-field">
          <span>Машина</span>
          <CustomSelect
            value={machineValue}
            options={machineOptions}
            onChange={onMachineChange}
            ariaLabel="Фильтр результатов по машине"
            className="results-filter results-filter--machine"
          />
        </label>

        <label className="results-filter-field">
          <span>Команда</span>
          <CustomSelect
            value={commandValue}
            options={commandOptions}
            onChange={onCommandChange}
            ariaLabel="Фильтр результатов по команде"
            className="results-filter results-filter--command"
          />
        </label>

        <div className="results-filter-field results-filter-field--date">
          <span>Период</span>
          <div className="results-date-filter">
            <button
              type="button"
              className="results-date-filter__trigger"
              aria-label={formatResultDateRangeLabel(dateRange)}
              onClick={() => setIsDateRangeOpen((value) => !value)}
            >
              {formatResultDateRangeLabel(dateRange)}
            </button>

            {isDateRangeOpen ? (
              <div className="results-date-filter__panel">
                <label className="results-date-filter__field">
                  <span>От</span>
                  <input
                    type="date"
                    value={draftRange.from}
                    onChange={(event) =>
                      setDraftRange((current) => ({
                        ...current,
                        from: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="results-date-filter__field">
                  <span>До</span>
                  <input
                    type="date"
                    value={draftRange.to}
                    onChange={(event) =>
                      setDraftRange((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="results-date-filter__actions">
                  <button
                    type="button"
                    className="results-date-filter__button results-date-filter__button--secondary"
                    onClick={() => {
                      const emptyRange = { from: "", to: "" };
                      setDraftRange(emptyRange);
                      onDateRangeChange(emptyRange);
                      setIsDateRangeOpen(false);
                    }}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="results-date-filter__button results-date-filter__button--primary"
                    onClick={() => {
                      onDateRangeChange(draftRange);
                      setIsDateRangeOpen(false);
                    }}
                  >
                    Применить
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="results-table-card">
        <header className="results-table-card__header">
          <div>
            <h2>История запусков</h2>
            <span className="results-table-card__caption">
              Поиск выполняется через верхнюю панель.
            </span>
          </div>
        </header>

        {rows.length ? (
          <>
            <div className="results-table-card__table-wrap">
              <table className="results-table-card__grid">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Статус</th>
                    <th>Машина</th>
                    <th>Команда</th>
                    <th>Дата результата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="results-actions__details"
                          onClick={() => onOpenResultDetail(row.id, row.machineId)}
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
                      <td>{row.machine}</td>
                      <td>
                        <span className="results-command" title={row.command}>
                          {row.command}
                        </span>
                      </td>
                      <td>{row.resultAt}</td>
                      <td>
                        <div className="results-actions">
                          <button
                            type="button"
                            className="results-actions__logs"
                            onClick={() => onOpenLogs(row.taskId, row.machineId)}
                          >
                            Открыть логи
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="results-table-card__footer">
              <span className="results-table-card__count">
                {`Показано ${pagedRows.length} из ${rows.length}`}
              </span>
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                totalItems={rows.length}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="results-table-card__empty">
            <EmptyState
              title="Результаты не найдены"
              description="Измените фильтры или откройте другую машину, чтобы увидеть историю запусков."
            />
          </div>
        )}
      </section>
    </div>
  );
}
