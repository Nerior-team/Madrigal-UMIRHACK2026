export type ReportPeriod = "day" | "week" | "month" | "all";

export type ReportTaskItem = {
  id: string;
  machineId: string;
  machine: string;
  machineStatus: "online" | "running" | "offline" | "deleted";
  templateName: string;
  requestedBy: string;
  status: string;
  createdAtIso: string;
  durationMs?: number;
};

export type ReportSummaryRow = {
  id: string;
  title: string;
  totalTasks: number;
  successCount: number;
  errorCount: number;
  avgDurationMs?: number;
  actionLabel: string;
};

export type ReportsStats = {
  averageDurationMs: number;
  activeMachines: number;
  totalMachines: number;
  errorTasks: number;
  totalTasks: number;
  successRate: number;
  completedTasks: number;
  finishedTasks: number;
};

export type ReportsTrend = {
  duration: string;
  machines: string;
  errors: string;
  success: string;
};

export type ReportTimelinePoint = {
  id: string;
  label: string;
  totalTasks: number;
  successCount: number;
  errorCount: number;
};

export type ReportLoadRow = {
  id: string;
  label: string;
  totalTasks: number;
  successRate: number;
};
