import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Monitor,
  Percent,
} from "lucide-react";

import type { ReportsStats, ReportsTrend } from "./types";
import { formatDurationLong } from "./report-utils";

type ReportsStatsGridProps = {
  stats: ReportsStats;
  trend: ReportsTrend;
};

export function ReportsStatsGrid({
  stats,
  trend,
}: ReportsStatsGridProps) {
  const successRateValue = Number.isFinite(stats.successRate)
    ? stats.successRate
    : 0;

  return (
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
  );
}
