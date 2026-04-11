import type { MachineWorkspaceTask } from "./types";

type MachineTasksPanelProps = {
  tasks: MachineWorkspaceTask[];
  onOpenTasks: () => void;
  onOpenTaskLogs: (taskId: string) => void;
};

export function MachineTasksPanel({
  tasks,
  onOpenTasks,
  onOpenTaskLogs,
}: MachineTasksPanelProps) {
  return (
    <section className="machine-details__panel">
      <header className="machine-details__section-head">
        <h2>Недавние задачи</h2>
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
          tasks.slice(0, 3).map((task) => (
            <article key={task.id} className="machine-details__recent-card">
              <div>
                <p className="machine-details__recent-kicker">
                  Задача №{task.taskNumber}
                </p>
                <strong>{task.title}</strong>
                <p>{task.startedAt}</p>
              </div>
              <div className="machine-details__recent-actions">
                <span
                  className={`results-status results-status--${
                    task.status === "completed"
                      ? "success"
                      : task.status === "error"
                        ? "error"
                        : "cancelled"
                  }`}
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
          <p className="machine-details__empty">По этой машине пока нет задач</p>
        )}
      </div>
    </section>
  );
}
