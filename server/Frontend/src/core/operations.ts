export type BackendTaskLifecycle =
  | "queued"
  | "dispatched"
  | "accepted"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type OperationTaskGroup =
  | "queued"
  | "in_progress"
  | "completed"
  | "error";

export type OperationTaskPresentation = {
  group: OperationTaskGroup;
  taskStatusLabel: string;
  resultLabel: string;
  resultTone: "success" | "warning" | "danger" | "neutral";
  logTone: "success" | "warning" | "critical";
  resultStatusTone: "success" | "error" | "cancelled" | "pending";
};

export type TaskLike = {
  status: OperationTaskGroup;
};

const PRESENTATION_BY_STATUS: Record<
  BackendTaskLifecycle,
  OperationTaskPresentation
> = {
  queued: {
    group: "queued",
    taskStatusLabel: "В очереди",
    resultLabel: "Задача в очереди",
    resultTone: "neutral",
    logTone: "warning",
    resultStatusTone: "pending",
  },
  dispatched: {
    group: "queued",
    taskStatusLabel: "В очереди",
    resultLabel: "Задача готовится к запуску",
    resultTone: "neutral",
    logTone: "warning",
    resultStatusTone: "pending",
  },
  accepted: {
    group: "queued",
    taskStatusLabel: "В очереди",
    resultLabel: "Задача принята агентом",
    resultTone: "neutral",
    logTone: "warning",
    resultStatusTone: "pending",
  },
  running: {
    group: "in_progress",
    taskStatusLabel: "В процессе",
    resultLabel: "Задача выполняется",
    resultTone: "warning",
    logTone: "warning",
    resultStatusTone: "pending",
  },
  succeeded: {
    group: "completed",
    taskStatusLabel: "Завершено",
    resultLabel: "Задача завершена",
    resultTone: "success",
    logTone: "success",
    resultStatusTone: "success",
  },
  failed: {
    group: "error",
    taskStatusLabel: "Ошибка",
    resultLabel: "Задача завершилась ошибкой",
    resultTone: "danger",
    logTone: "critical",
    resultStatusTone: "error",
  },
  cancelled: {
    group: "completed",
    taskStatusLabel: "Отменено",
    resultLabel: "Задача отменена",
    resultTone: "neutral",
    logTone: "warning",
    resultStatusTone: "cancelled",
  },
};

export function getTaskPresentation(
  status: BackendTaskLifecycle,
): OperationTaskPresentation {
  return PRESENTATION_BY_STATUS[status];
}

export function groupTasksByStatus<T extends TaskLike>(
  tasks: T[],
): Record<OperationTaskGroup, T[]> {
  return tasks.reduce<Record<OperationTaskGroup, T[]>>(
    (accumulator, task) => {
      accumulator[task.status].push(task);
      return accumulator;
    },
    {
      queued: [],
      in_progress: [],
      completed: [],
      error: [],
    },
  );
}
