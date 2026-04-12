import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { api, type ResultDetailResponse, type TaskDetailResponse } from "../../core";
import { EmptyState } from "../primitives/EmptyState";
import { ModalFrame } from "../primitives/ModalFrame";
import { StatusBadge } from "../primitives/StatusBadge";
import {
  OperationConsole,
  type OperationConsoleBlock,
  type OperationConsoleLine,
} from "./console/OperationConsole";

type ResultDetailModalProps = {
  resultId: string;
  onClose: () => void;
};

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} мс`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} с`;
  }

  const minutes = Math.floor(seconds / 60);
  const restSeconds = Math.round(seconds % 60);
  return `${minutes} мин ${restSeconds} с`;
}

export function ResultDetailModal({
  resultId,
  onClose,
}: ResultDetailModalProps) {
  const [result, setResult] = useState<ResultDetailResponse | null>(null);
  const [task, setTask] = useState<TaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const resultResponse = await api.getResult(resultId);
        const taskResponse = await api.getTask(resultResponse.taskId);

        if (cancelled) return;

        setResult(resultResponse);
        setTask(taskResponse);
      } catch {
        if (cancelled) return;
        setResult(null);
        setTask(null);
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
  }, [resultId]);

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
    if (!result) return [];

    const items: OperationConsoleLine[] = [
      {
        id: `${result.id}:command`,
        tone: "command",
        label: "$",
        text: result.shell.command,
      },
    ];

    if (!result.shell.stdout && !result.shell.stderr) {
      items.push({
        id: `${result.id}:empty`,
        tone: "system" as const,
        label: "system",
        text: "Команда завершилась без текстового вывода.",
      });
    }

    return items;
  }, [result]);

  const consoleBlocks = useMemo(() => {
    if (!result) return [];

    const blocks: OperationConsoleBlock[] = [];

    if (result.shell.stdout) {
      blocks.push({
        id: `${result.id}:stdout`,
        title: "stdout",
        text: result.shell.stdout,
      });
    }

    if (result.shell.stderr) {
      blocks.push({
        id: `${result.id}:stderr`,
        title: "stderr",
        text: result.shell.stderr,
        tone: "danger",
      });
    }

    return blocks;
  }, [result]);

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
          title={task?.title ?? "Результат выполнения"}
          subtitle={
            task
              ? `${task.machine} • ${task.requestedBy}`
              : "Загружаем результат команды"
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
          {isLoading ? (
            <EmptyState
              title="Загружаем результат"
              description="Получаем shell output и parsed payload из backend."
            />
          ) : hasError || !result ? (
            <EmptyState
              title="Не удалось открыть результат"
              description="Backend не вернул данные результата или доступ к нему отсутствует."
            />
          ) : (
            <div className="operation-result">
              <div className="operation-modal__meta">
                <div className="operation-modal__meta-item">
                  <span>Статус</span>
                  <StatusBadge
                    label={result.shell.exitCode === 0 ? "Выполнено" : "Ошибка"}
                    tone={result.shell.exitCode === 0 ? "success" : "danger"}
                  />
                </div>
                <div className="operation-modal__meta-item">
                  <span>Код выхода</span>
                  <strong>{result.shell.exitCode}</strong>
                </div>
                <div className="operation-modal__meta-item">
                  <span>Длительность</span>
                  <strong>{formatDuration(result.shell.durationMs)}</strong>
                </div>
                <div className="operation-modal__meta-item">
                  <span>Создан</span>
                  <strong>{result.createdAt}</strong>
                </div>
              </div>

              {result.summary ? (
                <section className="operation-result__summary">
                  <h3>Краткий итог</h3>
                  <p>{result.summary}</p>
                </section>
              ) : null}

              <OperationConsole
                title={task?.machine ?? "Машина"}
                subtitle={result.parserKind}
                lines={consoleLines}
                blocks={consoleBlocks}
                emptyMessage="Команда завершилась без текстового вывода."
              />

              {result.parsedPayload ? (
                <section className="operation-result__payload">
                  <h3>Parsed payload</h3>
                  <pre>{JSON.stringify(result.parsedPayload, null, 2)}</pre>
                </section>
              ) : null}
            </div>
          )}
        </ModalFrame>
      </div>
    </div>
  );
}
