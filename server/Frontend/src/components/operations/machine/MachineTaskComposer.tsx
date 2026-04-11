import { useMemo } from "react";

import { CustomSelect } from "../../primitives/CustomSelect";
import type { MachineTaskComposerProps } from "./types";

export function MachineTaskComposer({
  isActive = false,
  canCreateTask,
  taskRoleLabel,
  machineName,
  machineOs,
  taskTemplateOptions,
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
}: MachineTaskComposerProps) {
  const selectedTaskTemplate = useMemo(
    () =>
      taskTemplateOptions.find(
        (template) => template.templateKey === selectedTaskTemplateKey,
      ) ?? null,
    [selectedTaskTemplateKey, taskTemplateOptions],
  );

  const templateOptions = useMemo(
    () => [
      {
        value: "",
        label: taskTemplateOptions.length
          ? "Введите или выберите команду"
          : "Нет доступных команд",
      },
      ...taskTemplateOptions.map((template) => ({
        value: template.templateKey,
        label: template.name,
      })),
    ],
    [taskTemplateOptions],
  );

  return (
    <section
      className={`machine-details__panel machine-details__panel--task-create${
        isActive ? " machine-details__panel--active" : ""
      }`}
      data-testid="machine-task-composer-section"
    >
      <header className="machine-details__section-head">
        <h2>Задача</h2>
        <span className="machine-details__task-role">{taskRoleLabel}</span>
      </header>

      {canCreateTask ? (
        <form className="machine-details__task-create-card" onSubmit={onTaskSubmit}>
          <label className="machine-details__task-field">
            <span>Команда</span>
            <CustomSelect
              value={selectedTaskTemplateKey}
              options={templateOptions}
              onChange={onTaskTemplateChange}
              ariaLabel="Выбор команды для машины"
            />
          </label>

          {selectedTaskTemplate?.parameters.length ? (
            selectedTaskTemplate.parameters.map((parameter) => (
              <label key={parameter.key} className="machine-details__task-field">
                <span>{parameter.label}</span>
                <CustomSelect
                  value={selectedTaskParameterValues[parameter.key] ?? ""}
                  options={parameter.allowedValues.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  onChange={(value) =>
                    onTaskParameterChange(parameter.key, value)
                  }
                  ariaLabel={parameter.label}
                />
              </label>
            ))
          ) : (
            <p className="machine-details__task-create-text">
              У выбранной команды нет дополнительных параметров.
            </p>
          )}

          {/^linux\b/i.test(machineOs) ? (
            <label className="machine-details__task-checkbox">
              <input
                type="checkbox"
                checked={taskUseSudo}
                onChange={(event) => onTaskUseSudoChange(event.target.checked)}
              />
              <span>Разрешить sudo</span>
            </label>
          ) : null}

          <div className="machine-details__task-terminal">
            <div className="machine-details__task-terminal-head">
              <span>{taskShellLabel}</span>
              <button
                type="button"
                className="machine-details__inline-action machine-details__inline-action--ghost"
                onClick={onCopyTaskPreview}
              >
                <span>Копировать</span>
              </button>
            </div>
            <code>
              {taskPreviewCommand ||
                "Выберите команду и параметры, чтобы увидеть итоговый запуск."}
            </code>
          </div>

          <div className="machine-details__task-actions">
            <button
              type="button"
              className="machine-details__link-button"
              onClick={onTaskReset}
            >
              Сбросить
            </button>
            <button
              type="submit"
              className="machine-details__primary-button"
              disabled={!canSubmitTask}
            >
              Добавить
            </button>
          </div>
        </form>
      ) : (
        <div className="machine-details__task-create-card">
          <strong>{machineName}</strong>
          <p className="machine-details__task-create-text">
            Для этой машины доступен только выбор разрешённых сценариев от
            администратора.
          </p>
        </div>
      )}
    </section>
  );
}
