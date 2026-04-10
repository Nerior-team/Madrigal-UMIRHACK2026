import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, type TaskDetailResponse, type TaskLogLineResponse } from "../../core";
import { EmptyState } from "../primitives/EmptyState";
import { ModalFrame } from "../primitives/ModalFrame";
import { StatusBadge } from "../primitives/StatusBadge";

type ConsoleModalProps = {
  taskId: string;
  onClose: () => void;
};

function getTaskBadgeTone(
  status: TaskDetailResponse["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";
  if (status === "error") return "danger";
  if (status === "queued") return "neutral";
  return "warning";
}

export function ConsoleModal({
  taskId,
  onClose,
}: ConsoleModalProps) {
  const [task, setTask] = useState<TaskDetailResponse | null>(null);
  const [lines, setLines] = useState<TaskLogLineResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const [taskResponse, logsResponse] = await Promise.all([
          api.getTask(taskId),
          api.getTaskLogs(taskId),
        ]);

        if (cancelled) return;

        setTask(taskResponse);
        setLines(logsResponse);
      } catch {
        if (cancelled) return;
        setTask(null);
        setLines([]);
        setHasError(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="operation-modal__overlay"
      role="presentation"
      onClick={onClose}
    >
      <div className="operation-modal__container" onClick={(event) => event.stopPropagation()}>
        <ModalFrame
          title={task?.title ?? "Логи задачи"}
          subtitle={
            task
              ? `${task.machine} • ${task.renderedCommand}`
              : "Загружаем задачу и её поток выполнения"
          }
          actions={
            <button
              type="button"
              className="operation-modal__close"
              aria-label="Закрыть"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          }
        >
          <div className="operation-modal__meta">
            <div className="operation-modal__meta-item">
              <span>Статус</span>
              <StatusBadge
                label={task?.statusLabel ?? "Загрузка"}
                tone={task ? getTaskBadgeTone(task.status) : "neutral"}
              />
            </div>
            <div className="operation-modal__meta-item">
              <span>Запустил</span>
              <strong>{task?.requestedBy ?? "Нет данных"}</strong>
            </div>
            <div className="operation-modal__meta-item">
              <span>Старт</span>
              <strong>{task?.startedAt ?? "Нет данных"}</strong>
            </div>
            <div className="operation-modal__meta-item">
              <span>Завершение</span>
              <strong>{task?.completedAt ?? "Ещё выполняется"}</strong>
            </div>
          </div>

          {isLoading ? (
            <EmptyState
              title="Загружаем логи"
              description="Получаем поток выполнения задачи из backend."
            />
          ) : hasError ? (
            <EmptyState
              title="Не удалось открыть логи"
              description="Backend не вернул детали этой задачи или доступ уже недоступен."
            />
          ) : (
            <div className="operation-console">
              <div className="operation-console__header">
                <span>{task?.machine ?? "Машина"}</span>
                <span>{task?.templateKey ?? "Команда"}</span>
              </div>
              <div className="operation-console__body" role="log" aria-live="polite">
                {task ? (
                  <div className="operation-console__line operation-console__line--command">
                    <span className="operation-console__prefix">$</span>
                    <span className="operation-console__text">{task.renderedCommand}</span>
                  </div>
                ) : null}

                {lines.length ? (
                  lines.map((line) => (
                    <div
                      key={line.id}
                      className={`operation-console__line operation-console__line--${line.stream}`}
                    >
                      <span className="operation-console__timestamp">{line.createdAt}</span>
                      <span className="operation-console__channel">{line.stream}</span>
                      <span className="operation-console__text">{line.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="operation-console__line operation-console__line--system">
                    <span className="operation-console__channel">system</span>
                    <span className="operation-console__text">
                      Логи для этой задачи пока не поступили.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalFrame>
      </div>
    </div>
  );
}
