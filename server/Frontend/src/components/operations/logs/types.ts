export type LogsWorkspaceFilterTone =
  | "all"
  | "success"
  | "warning"
  | "critical";

export type LogsWorkspaceEntry = {
  id: string;
  taskId: string;
  machineId: string;
  taskTitle: string;
  action: string;
  email: string;
  status: string;
  tone: "success" | "warning" | "critical";
  createdAt: string;
  machine: string;
};

export type LogsWorkspaceStreamItem = {
  id: string;
  taskId: string;
  machineId: string;
  kind: "request" | "response";
  machine: string;
  title: string;
  text: string;
  createdAt: string;
};

export type LogsWorkspaceProps = {
  scopeSummary: string;
  filterTone: LogsWorkspaceFilterTone;
  statusStats: {
    success: number;
    warning: number;
    critical: number;
  };
  totalEntries: number;
  totalStreamItems: number;
  autoScrollEnabled: boolean;
  entries: LogsWorkspaceEntry[];
  streamItems: LogsWorkspaceStreamItem[];
  onFilterToneChange: (tone: LogsWorkspaceFilterTone) => void;
  onToggleAutoScroll: () => void;
  onOpenTaskLogs: (taskId: string, machineId: string) => void;
};
