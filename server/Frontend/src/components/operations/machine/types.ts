import type { FormEvent } from "react";

import type { CommandTemplateOption } from "../../../core";

export type MachineWorkspaceMachine = {
  id: string;
  name: string;
  hostname: string;
  os: string;
  heartbeat: string;
  owner: string;
  role: string;
  status: "online" | "running" | "offline" | "deleted";
  statusLabel: string;
};

export type MachineWorkspaceTask = {
  id: string;
  title: string;
  taskNumber: string;
  startedAt: string;
  completedAt?: string;
  resultText: string;
  status: "queued" | "completed" | "in_progress" | "error";
  machineId: string;
};

export type MachineWorkspaceResult = {
  id: string;
  title: string;
  statusLabel: string;
  statusTone: "success" | "error" | "cancelled" | "pending";
  command: string;
  resultAt: string;
  taskId: string;
  machineId: string;
};

export type MachineWorkspaceLog = {
  id: string;
  taskId: string;
  taskTitle: string;
  action: string;
  email: string;
  status: string;
  tone: "success" | "warning" | "critical";
  createdAt: string;
  machineId: string;
};

type MachineTaskComposerControls = {
  canCreateTask: boolean;
  taskRoleLabel: string;
  taskTemplateOptions: CommandTemplateOption[];
  selectedTaskTemplateKey: string;
  selectedTaskParameterValues: Record<string, string>;
  taskUseSudo: boolean;
  taskShellLabel: "Bash" | "Shell";
  taskPreviewCommand: string;
  canSubmitTask: boolean;
  onTaskTemplateChange: (templateKey: string) => void;
  onTaskParameterChange: (parameterKey: string, value: string) => void;
  onTaskUseSudoChange: (nextValue: boolean) => void;
  onTaskReset: () => void;
  onTaskSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCopyTaskPreview: () => void;
};

export type MachineTaskComposerProps = MachineTaskComposerControls & {
  isActive?: boolean;
  machineName: string;
  machineOs: string;
};

export type MachineWorkspaceProps = MachineTaskComposerControls & {
  machine: MachineWorkspaceMachine;
  activeSection: "dashboard" | "tasks" | "results" | "logs";
  tasks: MachineWorkspaceTask[];
  results: MachineWorkspaceResult[];
  logs: MachineWorkspaceLog[];
  onOpenTasks: () => void;
  onOpenResults: () => void;
  onOpenLogs: () => void;
  onOpenTaskLogs: (taskId: string) => void;
  onOpenResultDetail: (resultId: string) => void;
};
