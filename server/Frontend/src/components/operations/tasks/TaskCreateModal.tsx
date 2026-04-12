import type { FormEvent } from "react";

import { X } from "lucide-react";

import type { CommandTemplateOption } from "../../../core";
import { CustomSelect } from "../../primitives/CustomSelect";

type TaskCreateModalProps = {
  isOpen: boolean;
  machineOptions: Array<{
    value: string;
    label: string;
  }>;
  machineId: string;
  onMachineChange: (value: string) => void;
  templateOptions: Array<{
    value: string;
    label: string;
  }>;
  templateId: string;
  onTemplateChange: (value: string) => void;
  selectedTemplate: CommandTemplateOption | null;
  parameterValues: Record<string, string>;
  onParameterChange: (parameterKey: string, value: string) => void;
  previewShellLabel: "Bash" | "Shell";
  previewCommand: string;
  canSubmit: boolean;
  onReset: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TaskCreateModal({
  isOpen,
  machineOptions,
  machineId,
  onMachineChange,
  templateOptions,
  templateId,
  onTemplateChange,
  selectedTemplate,
  parameterValues,
  onParameterChange,
  previewShellLabel,
  previewCommand,
  canSubmit,
  onReset,
  onClose,
  onSubmit,
}: TaskCreateModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="task-create-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-create-title"
      onClick={onClose}
    >
      <form
        className="task-create-modal"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="task-create-modal__close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="task-create-modal__head">
          <p>Новая задача</p>
          <h2 id="task-create-title">Создание задачи</h2>
        </div>

        <label className="task-create-modal__field">
          <span>Машина</span>
          <CustomSelect
            value={machineId}
            options={machineOptions}
            onChange={onMachineChange}
            ariaLabel="Выбор машины для задачи"
          />
        </label>

        <label className="task-create-modal__field">
          <span>Команда</span>
          <CustomSelect
            value={templateId}
            options={templateOptions}
            onChange={onTemplateChange}
            disabled={!machineId || templateOptions.length <= 1}
            ariaLabel="Выбор команды для задачи"
          />
        </label>

        {selectedTemplate?.parameters.length ? (
          <div className="task-create-modal__params">
            {selectedTemplate.parameters.map((parameter) => (
              <label key={parameter.key} className="task-create-modal__field">
                <span>{parameter.label}</span>
                <CustomSelect
                  value={parameterValues[parameter.key] ?? ""}
                  options={parameter.allowedValues.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  onChange={(value) => onParameterChange(parameter.key, value)}
                  ariaLabel={`Параметр ${parameter.label}`}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="task-create-modal__note">
            У выбранной команды нет дополнительных параметров.
          </p>
        )}

        <div className="task-create-modal__terminal">
          <div className="task-create-modal__terminal-head">
            <span>{previewShellLabel}</span>
            <span>Команда для отправки</span>
          </div>
          <code>
            {previewCommand ||
              "Выберите машину, команду и параметры, чтобы увидеть итоговую строку."}
          </code>
        </div>

        <div className="task-create-modal__actions">
          <button
            type="button"
            className="task-create-modal__secondary"
            onClick={onReset}
          >
            Сбросить
          </button>
          <button
            type="submit"
            className="task-create-modal__submit"
            disabled={!canSubmit}
          >
            Добавить задачу
          </button>
        </div>
      </form>
    </div>
  );
}
