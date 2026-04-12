import type { MachineWorkspaceTask } from "./types";

type MachineTasksPanelProps = {
  isActive?: boolean;
  tasks: MachineWorkspaceTask[];
  onOpenTasks: () => void;
  onOpenTaskLogs: (taskId: string) => void;
};

function getTaskStatusTone(status: MachineWorkspaceTask["status"]) {
  if (status === "completed") return "success";
  if (status === "error") return "error";
  return "pending";
}

export function MachineTasksPanel({
  isActive = false,
  tasks,
  onOpenTasks,
  onOpenTaskLogs,
}: MachineTasksPanelProps) {
  return (
    <section
      className={`machine-details__panel${
        isActive ? " machine-details__panel--active" : ""
      }`}
      data-testid="machine-tasks-section"
    >
      <header className="machine-details__section-head">
        <div>
          <h2>Задачи по машине</h2>
          <p className="machine-details__section-note">
            Последние постановки в очередь, запуски и завершения.
          </p>
        </div>
        <button
          type="button"
          className="machine-details__link-button"
          onClick={onOpenTasks}
        >
          Смотреть все
        </button>
      </header>

      <div className="machine-details__recent-list">
        {tasks.length ? (
          tasks.slice(0, 4).map((task) => (
            <article key={task.id} className="machine-details__recent-card">
              <div>
                <p className="machine-details__recent-kicker">{`Задача #${task.taskNumber}`}</p>
                <strong>{task.title}</strong>
                <p>{`Старт: ${task.startedAt}`}</p>
                {task.completedAt ? <p>{`Завершено: ${task.completedAt}`}</p> : null}
              </div>
              <div className="machine-details__recent-actions">
                <span
                  className={`results-status results-status--${getTaskStatusTone(
                    task.status,
                  )}`}
                >
                  {task.resultText}
                </span>
                <button
                  type="button"
                  className="machine-details__link-button"
                  onClick={() => onOpenTaskLogs(task.id)}
                >
                  Посмотреть логи
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="machine-details__empty">По этой машине задач пока нет.</p>
        )}
      </div>
    </section>
  );
}
