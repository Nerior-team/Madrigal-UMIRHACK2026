import { useEffect, useMemo, useState } from "react";

import type { TaskCardResponse } from "../../../core";
import {
  type OperationTaskGroup,
  type TaskSection,
} from "../../../core/operations";
import {
  formatResultDateRangeLabel,
  type ResultDateRange,
} from "../../../core/results";
import { EmptyState } from "../../primitives/EmptyState";
import { Pagination } from "../../primitives/Pagination";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../primitives/CustomSelect";

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
  machineValue: string;
  templateValue: string;
  dateRange: ResultDateRange;
  machineOptions: Array<CustomSelectOption<string>>;
  templateOptions: Array<CustomSelectOption<string>>;
  sections: Array<TaskSection<TaskCardResponse>>;
  onFilterChange: (value: "all" | OperationTaskGroup) => void;
  onMachineChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onDateRangeChange: (range: ResultDateRange) => void;
  onOpenLogs: (taskId: string, machineId: string) => void;
  onSecondaryAction: (task: TaskCardResponse) => void;
};

function getTaskActionLabels(task: TaskCardResponse) {
  const isActive = task.status === "in_progress" || task.status === "queued";

  return {
    secondaryActionLabel: isActive ? "Отменить" : "Повторить",
    primaryActionLabel: "Открыть логи",
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
  machineValue,
  templateValue,
  dateRange,
  machineOptions,
  templateOptions,
  sections,
  onFilterChange,
  onMachineChange,
  onTemplateChange,
  onDateRangeChange,
  onOpenLogs,
  onSecondaryAction,
}: TasksWorkspaceProps) {
  const [pages, setPages] = useState<Record<string, number>>({});
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<ResultDateRange>(dateRange);

  useEffect(() => {
    setDraftRange(dateRange);
  }, [dateRange]);

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

  const visibleItems = useMemo(
    () => sections.reduce((sum, section) => sum + section.cards.length, 0),
    [sections],
  );

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
          <p>
            {visibleItems === totalItems
              ? `Всего ${totalItems}`
              : `Показано ${visibleItems} из ${totalItems}`}
          </p>
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

      <div className="tasks-dashboard__filter-grid">
        <label className="tasks-filter-field">
          <span>Машина</span>
          <CustomSelect
            value={machineValue}
            options={machineOptions}
            onChange={onMachineChange}
            ariaLabel="Фильтр задач по машине"
            className="tasks-filter"
          />
        </label>

        <label className="tasks-filter-field">
          <span>Тип задачи</span>
          <CustomSelect
            value={templateValue}
            options={templateOptions}
            onChange={onTemplateChange}
            ariaLabel="Фильтр задач по типу"
            className="tasks-filter"
          />
        </label>

        <div className="tasks-filter-field tasks-filter-field--date">
          <span>Период запуска</span>
          <div className="results-date-filter tasks-date-filter">
            <button
              type="button"
              className="results-date-filter__trigger"
              aria-label={formatResultDateRangeLabel(dateRange)}
              onClick={() => setIsDateRangeOpen((value) => !value)}
            >
              {formatResultDateRangeLabel(dateRange)}
            </button>

            {isDateRangeOpen ? (
              <div className="results-date-filter__panel">
                <label className="results-date-filter__field">
                  <span>От</span>
                  <input
                    type="date"
                    value={draftRange.from}
                    onChange={(event) =>
                      setDraftRange((current) => ({
                        ...current,
                        from: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="results-date-filter__field">
                  <span>До</span>
                  <input
                    type="date"
                    value={draftRange.to}
                    onChange={(event) =>
                      setDraftRange((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="results-date-filter__actions">
                  <button
                    type="button"
                    className="results-date-filter__button results-date-filter__button--secondary"
                    onClick={() => {
                      const emptyRange = { from: "", to: "" };
                      setDraftRange(emptyRange);
                      onDateRangeChange(emptyRange);
                      setIsDateRangeOpen(false);
                    }}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="results-date-filter__button results-date-filter__button--primary"
                    onClick={() => {
                      onDateRangeChange(draftRange);
                      setIsDateRangeOpen(false);
                    }}
                  >
                    Применить
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`tasks-dashboard__columns tasks-dashboard__columns--${sections.length}`}
      >
        {pagedSections.map((section) => (
          <section key={section.key} className="tasks-status-column">
            <header className="tasks-status-column__header">
              <div>
                <h2>{section.label}</h2>
                <p>
                  {section.cards.length
                    ? `${section.cards.length} задач`
                    : "Нет задач по выбранным фильтрам"}
                </p>
              </div>
            </header>

            {section.visibleCards.length ? (
              <>
                <div className="tasks-status-column__cards">
                  {section.visibleCards.map((task) => {
                    const { secondaryActionLabel, primaryActionLabel } =
                      getTaskActionLabels(task);

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

                          <div className="task-card__meta">
                            <span className="task-card__meta-item">{task.machine}</span>
                            <span className="task-card__meta-item">
                              {task.templateKey}
                            </span>
                          </div>

                          <div className="task-card__timeline">
                            <p>{`Инициатор: ${task.requestedBy}`}</p>
                            <p>{`Старт: ${task.startedAt}`}</p>
                            {task.completedAt ? (
                              <p>{`Завершено: ${task.completedAt}`}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="task-card__command">
                          <span className="task-card__command-label">
                            Команда запуска
                          </span>
                          <code>{task.renderedCommand}</code>
                        </div>

                        <div className="task-card__divider" />

                        <div className="task-card__footer">
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
                  description="Измените фильтры или выберите другую машину, чтобы увидеть задачи."
                />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
