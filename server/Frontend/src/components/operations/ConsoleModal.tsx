import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { api, type TaskDetailResponse, type TaskLogLineResponse } from "../../core";
import { EmptyState } from "../primitives/EmptyState";
import { ModalFrame } from "../primitives/ModalFrame";
import { StatusBadge } from "../primitives/StatusBadge";
import {
  OperationConsole,
  type OperationConsoleLine,
} from "./console/OperationConsole";

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

function mapLogLineTone(
  stream: TaskLogLineResponse["stream"],
): "stdout" | "stderr" | "system" {
  if (stream === "stderr") return "stderr";
  if (stream === "system") return "system";
  return "stdout";
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

  const consoleLines = useMemo(() => {
    const items: OperationConsoleLine[] = lines.map((line) => ({
      id: line.id,
      tone: mapLogLineTone(line.stream),
      timestamp: line.createdAt,
      label: line.stream,
      text: line.text,
    }));

    if (task) {
      items.unshift({
        id: `${task.id}:command`,
        tone: "command",
        label: "$",
        text: task.renderedCommand,
      });

      if (lines.length === 0) {
        items.push({
          id: `${task.id}:empty`,
          tone: "system",
          label: "system",
          text: "Логи для этой задачи пока не поступили.",
        });
      }
    }

    return items;
  }, [lines, task]);

  return (
    <div
      className="operation-modal__overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="operation-modal__container"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalFrame
          title={task?.title ?? "Логи задачи"}
          subtitle={
            task
              ? `${task.machine} • ${task.requestedBy}`
              : "Загружаем задачу и её консольный вывод"
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
              <span>Отправил</span>
              <strong>{task?.requestedBy ?? "Нет данных"}</strong>
            </div>
            <div className="operation-modal__meta-item">
              <span>Старт</span>
              <strong>{task?.startedAt ?? "Нет данных"}</strong>
            </div>
            <div className="operation-modal__meta-item">
              <span>Завершение</span>
              <strong>{task?.completedAt ?? "Задача ещё выполняется"}</strong>
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
              description="Backend не вернул детали этой задачи или доступ к ней уже закрыт."
            />
          ) : (
            <OperationConsole
              title={task?.machine ?? "Машина"}
              subtitle={task?.templateKey ?? "Консоль"}
              lines={consoleLines}
              live
              emptyMessage="Логи для этой задачи пока не поступили."
            />
          )}
        </ModalFrame>
      </div>
    </div>
  );
}
