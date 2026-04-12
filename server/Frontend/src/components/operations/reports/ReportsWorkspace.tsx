import { useEffect, useMemo, useState } from "react";

import {
  CustomSelect,
  type CustomSelectOption,
} from "../../primitives/CustomSelect";
import { ReportsStatsGrid } from "./ReportsStatsGrid";
import { ReportsSummaryTable } from "./ReportsSummaryTable";
import { ReportsVisualGrid } from "./ReportsVisualGrid";
import {
  buildTimelineSeries,
  buildTopMachineRows,
} from "./report-utils";
import type {
  ReportPeriod,
  ReportSummaryRow,
  ReportTaskItem,
  ReportsStats,
  ReportsTrend,
} from "./types";

type ReportsWorkspaceProps = {
  reportPeriod: ReportPeriod;
  reportMachine: string;
  reportTemplate: string;
  reportTeam: string;
  tasks: ReportTaskItem[];
  machineOptions: Array<{ id: string; label: string }>;
  templateOptions: string[];
  teamOptions: string[];
  stats: ReportsStats;
  trend: ReportsTrend;
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

export function ReportsWorkspace({
  reportPeriod,
  reportMachine,
  reportTemplate,
  reportTeam,
  tasks,
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
  }, [reportPeriod, reportMachine, reportTemplate, reportTeam, rows, tasks]);

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

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const selectedMachine =
      reportMachine === "all"
        ? null
        : machineOptions.find((item) => item.id === reportMachine)?.label ?? null;
    if (selectedMachine) {
      labels.push(`Машина: ${selectedMachine}`);
    }
    if (reportTemplate !== "all") {
      labels.push(`Шаблон: ${reportTemplate}`);
    }
    if (reportTeam !== "all") {
      labels.push(`Пользователь: ${reportTeam}`);
    }
    return labels;
  }, [machineOptions, reportMachine, reportTemplate, reportTeam]);

  const timeline = useMemo(
    () => buildTimelineSeries(tasks, reportPeriod),
    [tasks, reportPeriod],
  );
  const topMachineRows = useMemo(() => buildTopMachineRows(tasks), [tasks]);

  return (
    <div className="reports-dashboard__body">
      <header className="reports-dashboard__header">
        <div className="reports-dashboard__title-box">
          <h1>Отчёты</h1>
          <p>{`Всего задач: ${stats.totalTasks}`}</p>
        </div>
      </header>

      {activeFilterLabels.length ? (
        <div className="reports-dashboard__chips" aria-label="Активные фильтры">
          {activeFilterLabels.map((label) => (
            <span key={label} className="reports-dashboard__chip">
              {label}
            </span>
          ))}
        </div>
      ) : null}

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

      <ReportsStatsGrid stats={stats} trend={trend} />

      <ReportsVisualGrid
        stats={stats}
        templateRows={rows}
        machineRows={topMachineRows}
        timeline={timeline}
      />

      <ReportsSummaryTable
        rows={rows}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onAction={onAction}
      />
    </div>
  );
}
