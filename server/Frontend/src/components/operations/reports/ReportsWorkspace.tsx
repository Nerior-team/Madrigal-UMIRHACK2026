import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Monitor,
  Percent,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CustomSelect, type CustomSelectOption } from "../../primitives/CustomSelect";
import { Pagination } from "../../primitives/Pagination";

type ReportPeriod = "day" | "week" | "month" | "all";

type ReportSummaryRow = {
  id: string;
  title: string;
  totalTasks: number;
  successCount: number;
  errorCount: number;
  avgDurationMs?: number;
  actionLabel: string;
};

type ReportsWorkspaceProps = {
  reportPeriod: ReportPeriod;
  reportMachine: string;
  reportTemplate: string;
  reportTeam: string;
  machineOptions: Array<{ id: string; label: string }>;
  templateOptions: string[];
  teamOptions: string[];
  stats: {
    averageDurationMs: number;
    activeMachines: number;
    totalMachines: number;
    errorTasks: number;
    totalTasks: number;
    successRate: number;
    completedTasks: number;
    finishedTasks: number;
  };
  trend: {
    duration: string;
    machines: string;
    errors: string;
    success: string;
  };
  rows: ReportSummaryRow[];
  onPeriodChange: (value: ReportPeriod) => void;
  onMachineChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onAction: (row: ReportSummaryRow) => void;
};

const PAGE_SIZE = 8;

const PERIOD_OPTIONS: Array<CustomSelectOption<ReportPeriod>> = [
  { value: "day", label: "Период: сутки" },
  { value: "week", label: "Период: неделя" },
  { value: "month", label: "Период: месяц" },
  { value: "all", label: "Период: всё время" },
];

function formatDurationLong(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "0 с";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${totalSeconds} с`;
  }

  return `${minutes} мин ${seconds} с`;
}

function formatDurationCompact(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "—";
  }

  if (durationMs >= 60_000) {
    return `${(durationMs / 60_000).toFixed(1)} мин`;
  }

  if (durationMs >= 1_000) {
    return `${(durationMs / 1_000).toFixed(1)} с`;
  }

  return `${Math.round(durationMs)} мс`;
}

function getReportTemplateIcon(templateTitle: string): string {
  return templateTitle.trim().toLowerCase() === "db-sync" ? "/sync.png" : "/zadachi.png";
}

export function ReportsWorkspace({
  reportPeriod,
  reportMachine,
  reportTemplate,
  reportTeam,
  machineOptions,
  templateOptions,
  teamOptions,
  stats,
  trend,
  rows,
  onPeriodChange,
  onMachineChange,
  onTemplateChange,
  onTeamChange,
  onAction,
}: ReportsWorkspaceProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [reportPeriod, reportMachine, reportTemplate, reportTeam, rows]);

  const machineSelectOptions = useMemo<CustomSelectOption<string>[]>(
    () => [
      { value: "all", label: "Все машины" },
      ...machineOptions.map((machine) => ({
        value: machine.id,
        label: machine.label,
      })),
    ],
    [machineOptions],
  );

  const templateSelectOptions = useMemo<CustomSelectOption<string>[]>(
    () => [
      { value: "all", label: "Все шаблоны" },
      ...templateOptions.map((template) => ({
        value: template,
        label: template,
      })),
    ],
    [templateOptions],
  );

  const teamSelectOptions = useMemo<CustomSelectOption<string>[]>(
    () => [
      { value: "all", label: "Все пользователи" },
      ...teamOptions.map((team) => ({
        value: team,
        label: team,
      })),
    ],
    [teamOptions],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const chartRows = rows.slice(0, 5);
  const chartMax = Math.max(1, ...chartRows.map((row) => row.totalTasks));
  const successRateValue = Number.isFinite(stats.successRate) ? stats.successRate : 0;
  const errorRateValue = stats.totalTasks
    ? Math.min(100, (stats.errorTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="reports-dashboard__body">
      <header className="reports-dashboard__header">
        <div className="reports-dashboard__title-box">
          <h1>Отчёты</h1>
          <p>{`Всего задач: ${stats.totalTasks}`}</p>
        </div>
      </header>

      <div className="reports-dashboard__filters">
        <CustomSelect
          value={reportPeriod}
          options={PERIOD_OPTIONS}
          onChange={onPeriodChange}
          ariaLabel="Фильтр отчётов по периоду"
          className="reports-filter reports-filter--period"
        />
        <CustomSelect
          value={reportMachine}
          options={machineSelectOptions}
          onChange={onMachineChange}
          ariaLabel="Фильтр отчётов по машине"
          className="reports-filter reports-filter--machine"
        />
        <CustomSelect
          value={reportTemplate}
          options={templateSelectOptions}
          onChange={onTemplateChange}
          ariaLabel="Фильтр отчётов по шаблону"
          className="reports-filter reports-filter--template"
        />
        <CustomSelect
          value={reportTeam}
          options={teamSelectOptions}
          onChange={onTeamChange}
          ariaLabel="Фильтр отчётов по пользователю"
          className="reports-filter reports-filter--team"
        />
      </div>

      <div className="reports-dashboard__stats">
        <article className="reports-stat-card">
          <header>
            <p>Средняя длительность</p>
            <Clock3 size={24} />
          </header>
          <strong>{formatDurationLong(stats.averageDurationMs)}</strong>
          <p className="reports-stat-card__trend reports-stat-card__trend--up">
            <ArrowUpRight size={20} />
            <span>{trend.duration}</span>
          </p>
        </article>

        <article className="reports-stat-card">
          <header>
            <p>Активные машины</p>
            <Monitor size={24} />
          </header>
          <strong>{`${stats.activeMachines}/${stats.totalMachines}`}</strong>
          <p className="reports-stat-card__trend reports-stat-card__trend--up">
            <ArrowUpRight size={20} />
            <span>{trend.machines}</span>
          </p>
        </article>

        <article className="reports-stat-card">
          <header>
            <p>Число ошибок</p>
            <AlertTriangle size={24} />
          </header>
          <strong>{`${stats.errorTasks}/${stats.totalTasks}`}</strong>
          <p className="reports-stat-card__trend reports-stat-card__trend--down">
            <ArrowDownRight size={20} />
            <span>{trend.errors}</span>
          </p>
        </article>

        <article className="reports-stat-card">
          <header>
            <p>Процент успеха</p>
            <Percent size={24} />
          </header>
          <strong>{`${successRateValue.toFixed(1)}%`}</strong>
          <p className="reports-stat-card__trend reports-stat-card__trend--up">
            <ArrowUpRight size={20} />
            <span>{trend.success}</span>
          </p>
        </article>
      </div>

      <div className="reports-visual-grid">
        <section className="reports-visual-card">
          <header className="reports-visual-card__header">
            <strong>Коэффициент успеха</strong>
            <span>По текущей выборке</span>
          </header>
          <div className="reports-visual-card__content reports-visual-card__content--donut">
            <div
              className="reports-donut"
              style={{
                background: `conic-gradient(#3bc405 0 ${successRateValue}%, #ed3030 ${successRateValue}% 100%)`,
              }}
              aria-hidden="true"
            >
              <div className="reports-donut__inner">
                <strong>{`${successRateValue.toFixed(1)}%`}</strong>
                <span>Успешно</span>
              </div>
            </div>

            <div className="reports-donut-legend">
              <p>
                <span className="reports-donut-legend__dot reports-donut-legend__dot--success" />
                {`Завершено: ${stats.completedTasks}`}
              </p>
              <p>
                <span className="reports-donut-legend__dot reports-donut-legend__dot--error" />
                {`Ошибок: ${stats.errorTasks}`}
              </p>
            </div>
          </div>
        </section>

        <section className="reports-visual-card">
          <header className="reports-visual-card__header">
            <strong>Нагрузка по шаблонам</strong>
            <span>Топ-5 по числу запусков</span>
          </header>
          <div className="reports-bars">
            {chartRows.length ? (
              chartRows.map((row) => {
                const percent = Math.max(8, Math.round((row.totalTasks / chartMax) * 100));
                return (
                  <article key={row.id} className="reports-bars__row">
                    <div className="reports-bars__label">
                      <strong>{row.title}</strong>
                      <span>{`${row.totalTasks} задач`}</span>
                    </div>
                    <div className="reports-bars__track">
                      <div className="reports-bars__fill" style={{ width: `${percent}%` }} />
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="reports-bars__empty">Данных для графика пока нет.</p>
            )}
          </div>
        </section>

        <section className="reports-visual-card">
          <header className="reports-visual-card__header">
            <strong>Ошибки против общего потока</strong>
            <span>Отношение ошибок к числу задач</span>
          </header>
          <div className="reports-visual-card__content reports-visual-card__content--progress">
            <div className="reports-progress">
              <div className="reports-progress__track">
                <div
                  className="reports-progress__fill"
                  style={{ width: `${Math.max(2, errorRateValue)}%` }}
                />
              </div>
              <div className="reports-progress__meta">
                <strong>{`${errorRateValue.toFixed(1)}%`}</strong>
                <span>{`Ошибок: ${stats.errorTasks} из ${stats.totalTasks}`}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="reports-table-card">
        <header className="reports-table-card__header">
          <div>
            <h2>Сводка по шаблонам</h2>
            <span className="reports-table-card__caption">
              Drill-down использует те же реальные данные, что и задачи, результаты и логи.
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
                    <td className="reports-table-card__success">{row.successCount}</td>
                    <td className="reports-table-card__error">{row.errorCount}</td>
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
                pageSize={PAGE_SIZE}
                totalItems={rows.length}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="reports-table-card__empty">
            <p>Нет данных для выбранных фильтров.</p>
          </div>
        )}
      </section>
    </div>
  );
}
