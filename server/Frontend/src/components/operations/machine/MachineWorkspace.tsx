import { MachineCommandsPanel } from "./commands/MachineCommandsPanel";
import { MachineLogsPanel } from "./MachineLogsPanel";
import { MachineOverviewGrid } from "./MachineOverviewGrid";
import { MachineResultsPanel } from "./MachineResultsPanel";
import { MachineTaskComposer } from "./MachineTaskComposer";
import { MachineTasksPanel } from "./MachineTasksPanel";
import type { MachineWorkspaceProps } from "./types";

export type { MachineWorkspaceProps } from "./types";

export function MachineWorkspace({
  machine,
  activeSection,
  canCreateTask,
  canManageCommands,
  taskRoleLabel,
  taskTemplateOptions,
  commandTemplates,
  selectedTaskTemplateKey,
  selectedTaskParameterValues,
  taskUseSudo,
  taskShellLabel,
  taskPreviewCommand,
  canSubmitTask,
  onTaskTemplateChange,
  onTaskParameterChange,
  onTaskUseSudoChange,
  onTaskReset,
  onTaskSubmit,
  onCopyTaskPreview,
  tasks,
  results,
  logs,
  onTemplatesChanged,
  onOpenTasks,
  onOpenResults,
  onOpenLogs,
  onOpenTaskLogs,
  onOpenResultDetail,
}: MachineWorkspaceProps) {
  return (
    <>
      <header className="machine-details__header machine-details__header--hero">
        <div>
          <h1>
            {machine.name} <span>{machine.owner}</span>
          </h1>
          <p className="machine-details__status">
            <span
              className={`machine-details__status-dot machine-details__status-dot--${machine.status}`}
            />
            <span>{machine.statusLabel}</span>
          </p>
        </div>
      </header>

      <MachineOverviewGrid machine={machine} />

      <MachineCommandsPanel
        machineId={machine.id}
        machineName={machine.name}
        machineOs={machine.os}
        machineRoleLabel={machine.role}
        commandTemplates={commandTemplates}
        canManageCommands={canManageCommands}
        onTemplatesChanged={onTemplatesChanged}
      />

      <div className="machine-details__dashboard-grid">
        <MachineTaskComposer
          isActive={activeSection === "tasks"}
          canCreateTask={canCreateTask}
          taskRoleLabel={taskRoleLabel}
          machineName={machine.name}
          machineOs={machine.os}
          taskTemplateOptions={taskTemplateOptions}
          selectedTaskTemplateKey={selectedTaskTemplateKey}
          selectedTaskParameterValues={selectedTaskParameterValues}
          taskUseSudo={taskUseSudo}
          taskShellLabel={taskShellLabel}
          taskPreviewCommand={taskPreviewCommand}
          canSubmitTask={canSubmitTask}
          onTaskTemplateChange={onTaskTemplateChange}
          onTaskParameterChange={onTaskParameterChange}
          onTaskUseSudoChange={onTaskUseSudoChange}
          onTaskReset={onTaskReset}
          onTaskSubmit={onTaskSubmit}
          onCopyTaskPreview={onCopyTaskPreview}
        />

        <MachineTasksPanel
          isActive={activeSection === "tasks"}
          tasks={tasks}
          onOpenTasks={onOpenTasks}
          onOpenTaskLogs={onOpenTaskLogs}
        />
      </div>

      <MachineResultsPanel
        isActive={activeSection === "results"}
        results={results}
        onOpenResults={onOpenResults}
        onOpenResultDetail={onOpenResultDetail}
        onOpenTaskLogs={onOpenTaskLogs}
      />

      <MachineLogsPanel
        isActive={activeSection === "logs"}
        logs={logs}
        onOpenLogs={onOpenLogs}
        onOpenTaskLogs={onOpenTaskLogs}
      />
    </>
  );
}
