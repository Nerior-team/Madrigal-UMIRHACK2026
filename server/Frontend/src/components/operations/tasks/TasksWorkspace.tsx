import { useEffect, useMemo, useState } from "react";

import type { TaskCardResponse } from "../../../core";
import {
  type OperationTaskGroup,
  type TaskSection,
} from "../../../core/operations";
import { EmptyState } from "../../primitives/EmptyState";
import { Pagination } from "../../primitives/Pagination";

const FILTER_OPTIONS: Array<{
  value: "all" | OperationTaskGroup;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "completed", label: "Завершённые" },
  { value: "in_progress", label: "В процессе" },
  { value: "queued", label: "В очереди" },
  { value: "error", label: "Ошибки" },
];

const PAGE_SIZE = 6;

export type TasksWorkspaceProps = {
  totalItems: number;
  activeFilter: "all" | OperationTaskGroup;
  sections: Array<TaskSection<TaskCardResponse>>;
  onFilterChange: (value: "all" | OperationTaskGroup) => void;
  onOpenLogs: (taskId: string, machineId: string) => void;
  onSecondaryAction: (task: TaskCardResponse) => void;
};

function getTaskActionLabels(task: TaskCardResponse) {
  const isActive = task.status === "in_progress" || task.status === "queued";

  return {
    secondaryActionLabel: isActive ? "Отменить" : "Повторить",
    primaryActionLabel: "Посмотреть логи",
    finishedLabel: isActive ? "Обновлено" : "Завершено",
  };
}

function getResultIcon(task: TaskCardResponse) {
  if (task.resultColor === "green") return "/greenport.png";
  if (task.resultColor === "yellow") return "/openport.png";
  if (task.resultColor === "gray") return "/server.png";
  return "/closeport.png";
}

export function TasksWorkspace({
  totalItems,
  activeFilter,
  sections,
  onFilterChange,
  onOpenLogs,
  onSecondaryAction,
}: TasksWorkspaceProps) {
  const [pages, setPages] = useState<Record<string, number>>({});

  useEffect(() => {
    setPages((current) =>
      sections.reduce<Record<string, number>>((accumulator, section) => {
        const totalPages = Math.max(
          1,
          Math.ceil(section.cards.length / PAGE_SIZE),
        );
        const currentPage = current[section.key] ?? 1;
        accumulator[section.key] = Math.min(currentPage, totalPages);
        return accumulator;
      }, {}),
    );
  }, [sections]);

  const pagedSections = useMemo(
    () =>
      sections.map((section) => {
        const page = pages[section.key] ?? 1;
        const startIndex = (page - 1) * PAGE_SIZE;

        return {
          ...section,
          page,
          visibleCards: section.cards.slice(startIndex, startIndex + PAGE_SIZE),
        };
      }),
    [pages, sections],
  );

  return (
    <div className="tasks-body">
      <header className="tasks-dashboard__header">
        <div className="tasks-dashboard__title-box">
          <h1>Задачи</h1>
          <p>{`Всего ${totalItems}`}</p>
        </div>
      </header>

      <div className="tasks-dashboard__controls">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`tasks-dashboard__chip ${
              activeFilter === filter.value
                ? "tasks-dashboard__chip--active"
                : ""
            }`}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="tasks-dashboard__statuses">
        {sections.map((section) => (
          <p key={section.key} className="tasks-dashboard__status-item">
            <span>{`${section.label} (${section.cards.length})`}</span>
          </p>
        ))}
      </div>

      <div
        className={`tasks-dashboard__columns tasks-dashboard__columns--${sections.length}`}
      >
        {pagedSections.map((section) => (
          <section key={section.key} className="tasks-status-column">
            {section.visibleCards.length ? (
              <>
                <div className="tasks-status-column__cards">
                  {section.visibleCards.map((task) => {
                    const {
                      secondaryActionLabel,
                      primaryActionLabel,
                      finishedLabel,
                    } = getTaskActionLabels(task);

                    return (
                      <article
                        key={task.id}
                        className={`task-card task-card--${task.status}`}
                      >
                        <div className="task-card__header">
                          <div className="task-card__title-box">
                            <p className="task-card__number">{`Задача #${task.taskNumber}`}</p>
                            <h3 className="task-card__title">{task.title}</h3>
                          </div>

                          <div className="task-card__timeline">
                            <p>{`Машина: ${task.machine}`}</p>
                            <p>{`Отправил: ${task.requestedBy}`}</p>
                            <p>{`Старт: ${task.startedAt}`}</p>
                            {task.completedAt ? (
                              <p>{`${finishedLabel}: ${task.completedAt}`}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="task-card__divider" />

                        <div className="task-card__footer">
                          <div className="task-card__server">
                            <img src="/server.png" alt="" aria-hidden="true" />
                            <span>{task.machine}</span>
                          </div>
                          <div
                            className={`task-card__result task-card__result--${task.resultColor}`}
                          >
                            <img src={getResultIcon(task)} alt="" aria-hidden="true" />
                            <div className="task-card__result-copy">
                              <strong>{task.statusLabel}</strong>
                              <span>{task.resultText}</span>
                            </div>
                          </div>
                        </div>

                        <div className="task-card__actions">
                          <button
                            type="button"
                            className="task-card__btn task-card__btn--secondary"
                            onClick={() => onSecondaryAction(task)}
                          >
                            {secondaryActionLabel}
                          </button>
                          <button
                            type="button"
                            className="task-card__btn task-card__btn--primary"
                            onClick={() => onOpenLogs(task.id, task.machineId)}
                          >
                            {primaryActionLabel}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="tasks-status-column__footer">
                  <Pagination
                    page={section.page}
                    pageSize={PAGE_SIZE}
                    totalItems={section.cards.length}
                    onChange={(nextPage) =>
                      setPages((current) => ({
                        ...current,
                        [section.key]: nextPage,
                      }))
                    }
                  />
                </div>
              </>
            ) : (
              <div className="tasks-status-column__empty">
                <EmptyState
                  title={`${section.label}: пусто`}
                  description="По подходящим фильтрам задач нет."
                />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
