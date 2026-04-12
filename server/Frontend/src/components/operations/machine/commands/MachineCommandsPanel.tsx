import { useEffect, useMemo, useState } from "react";

import {
  api,
  type CommandTemplateMutationInput,
  type CommandTemplateOption,
} from "../../../../core";
import { ApiError } from "../../../../core/http";
import { buildTaskPreview } from "../../../../core/task-preview";
import { CustomSelect } from "../../../primitives/CustomSelect";

type TemplateParameterDraft = {
  id: string;
  key: string;
  label: string;
  allowedValuesText: string;
};

type TemplateEditorState = {
  templateId: string | null;
  name: string;
  description: string;
  commandPattern: string;
  parserKind: string;
  isEnabled: boolean;
  parameters: TemplateParameterDraft[];
};

type MachineCommandsPanelProps = {
  machineId: string;
  machineName: string;
  machineOs: string;
  machineRoleLabel: string;
  commandTemplates: CommandTemplateOption[];
  canManageCommands: boolean;
  onTemplatesChanged: (templates: CommandTemplateOption[]) => void;
};

const parserKindOptions = [
  { value: "none", label: "Без дополнительного парсинга" },
  { value: "basic_diagnostics", label: "Базовая диагностика" },
  { value: "disk_usage", label: "Использование диска" },
  { value: "network_context", label: "Сетевой контекст" },
  { value: "memory_usage", label: "Использование памяти" },
] as const;

function resolveRunner(machineOs: string): "shell" | "powershell" {
  return /^windows\b/i.test(machineOs.trim()) ? "powershell" : "shell";
}

function resolveShellLabel(machineOs: string): "Bash" | "Shell" {
  return /^linux\b/i.test(machineOs.trim()) ? "Bash" : "Shell";
}

function createParameterDraft(): TemplateParameterDraft {
  return {
    id: `param-${Math.random().toString(36).slice(2, 10)}`,
    key: "",
    label: "",
    allowedValuesText: "",
  };
}

function createEmptyEditorState(): TemplateEditorState {
  return {
    templateId: null,
    name: "",
    description: "",
    commandPattern: "",
    parserKind: "none",
    isEnabled: true,
    parameters: [],
  };
}

function createEditorStateFromTemplate(
  template: CommandTemplateOption,
): TemplateEditorState {
  return {
    templateId: template.id ?? null,
    name: template.name,
    description: template.description ?? "",
    commandPattern: template.commandPattern,
    parserKind: template.parserKind,
    isEnabled: template.isEnabled,
    parameters: template.parameters.map((parameter, index) => ({
      id: `${template.templateKey}-${parameter.key}-${index}`,
      key: parameter.key,
      label: parameter.label,
      allowedValuesText: parameter.allowedValues.join(", "),
    })),
  };
}

function parseAllowedValues(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTemplateMeta(template: CommandTemplateOption): string {
  const parameters = template.parameters.length
    ? `${template.parameters.length} параметр${template.parameters.length === 1 ? "" : template.parameters.length < 5 ? "а" : "ов"}`
    : "без параметров";
  return `${parameters} • ${template.runner === "powershell" ? "PowerShell" : "Shell"}`;
}

export function MachineCommandsPanel({
  machineId,
  machineName,
  machineOs,
  machineRoleLabel,
  commandTemplates,
  canManageCommands,
  onTemplatesChanged,
}: MachineCommandsPanelProps) {
  const [editorState, setEditorState] = useState<TemplateEditorState>(
    createEmptyEditorState(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const builtinTemplates = useMemo(
    () => commandTemplates.filter((template) => template.isBuiltin),
    [commandTemplates],
  );
  const customTemplates = useMemo(
    () => commandTemplates.filter((template) => !template.isBuiltin),
    [commandTemplates],
  );

  useEffect(() => {
    if (!editorState.templateId) {
      return;
    }

    const currentTemplate = customTemplates.find(
      (template) => template.id === editorState.templateId,
    );
    if (!currentTemplate) {
      setEditorState(createEmptyEditorState());
      return;
    }

    setEditorState(createEditorStateFromTemplate(currentTemplate));
  }, [customTemplates, editorState.templateId]);

  const previewCommand = useMemo(() => {
    const params = editorState.parameters.reduce<Record<string, string>>(
      (accumulator, parameter) => {
        if (!parameter.key.trim()) {
          return accumulator;
        }
        const values = parseAllowedValues(parameter.allowedValuesText);
        accumulator[parameter.key.trim()] = values[0] ?? `{${parameter.key.trim()}}`;
        return accumulator;
      },
      {},
    );

    return (
      buildTaskPreview({
        commandPattern: editorState.commandPattern,
        params,
        useSudo: false,
      }) || "Введите шаблон команды и параметры, чтобы увидеть итоговую строку."
    );
  }, [editorState.commandPattern, editorState.parameters]);

  const isEditing = Boolean(editorState.templateId);
  const shellLabel = resolveShellLabel(machineOs);

  const resetEditor = () => {
    setEditorState(createEmptyEditorState());
    setNotice(null);
    setError(null);
  };

  const handleParameterChange = (
    parameterId: string,
    field: keyof Omit<TemplateParameterDraft, "id">,
    value: string,
  ) => {
    setEditorState((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) =>
        parameter.id === parameterId
          ? { ...parameter, [field]: value }
          : parameter,
      ),
    }));
  };

  const handlePersist = async () => {
    setNotice(null);
    setError(null);

    if (!editorState.name.trim()) {
      setError("Укажите название команды.");
      return;
    }
    if (!editorState.commandPattern.trim()) {
      setError("Укажите шаблон команды.");
      return;
    }

    const parameters: CommandTemplateMutationInput["parameters"] = [];
    for (const parameter of editorState.parameters) {
      const hasAnyValue =
        parameter.key.trim() ||
        parameter.label.trim() ||
        parameter.allowedValuesText.trim();
      if (!hasAnyValue) {
        continue;
      }

      if (!parameter.key.trim() || !parameter.label.trim()) {
        setError("У каждого параметра должны быть заполнены ключ и название.");
        return;
      }

      const allowedValues = parseAllowedValues(parameter.allowedValuesText);
      if (!allowedValues.length) {
        setError(`У параметра «${parameter.label || parameter.key}» должен быть хотя бы один вариант.`);
        return;
      }

      parameters.push({
        key: parameter.key.trim(),
        label: parameter.label.trim(),
        allowedValues,
      });
    }

    const payload: CommandTemplateMutationInput = {
      name: editorState.name.trim(),
      description: editorState.description.trim() || null,
      runner: resolveRunner(machineOs),
      commandPattern: editorState.commandPattern.trim(),
      parserKind: editorState.parserKind,
      parameters,
      isEnabled: editorState.isEnabled,
    };

    setIsSaving(true);
    try {
      const template = editorState.templateId
        ? await api.updateMachineCommandTemplate(
            machineId,
            editorState.templateId,
            payload,
          )
        : await api.createMachineCommandTemplate(machineId, payload);

      const nextTemplates = editorState.templateId
        ? commandTemplates.map((item) =>
            item.id === template.id ? template : item,
          )
        : [...commandTemplates, template];

      onTemplatesChanged(nextTemplates);
      setEditorState(createEditorStateFromTemplate(template));
      setNotice(
        editorState.templateId
          ? "Шаблон обновлён."
          : "Шаблон добавлен и уже доступен для запуска задач.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.body
          : "Не удалось сохранить шаблон команды.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: CommandTemplateOption) => {
    if (!template.id) {
      return;
    }

    setNotice(null);
    setError(null);
    setDeletingTemplateId(template.id);
    try {
      await api.deleteMachineCommandTemplate(machineId, template.id);
      const nextTemplates = commandTemplates.filter((item) => item.id !== template.id);
      onTemplatesChanged(nextTemplates);
      if (editorState.templateId === template.id) {
        setEditorState(createEmptyEditorState());
      }
      setNotice(`Шаблон «${template.name}» удалён.`);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.body
          : "Не удалось удалить шаблон команды.",
      );
    } finally {
      setDeletingTemplateId(null);
    }
  };

  if (!canManageCommands) {
    return null;
  }

  return (
    <section className="machine-details__panel machine-commands">
      <header className="machine-details__section-head">
        <div>
          <h2>Команды для машины</h2>
          <p className="machine-details__section-note">
            Владелец и администратор управляют безопасными шаблонами для{" "}
            {machineName}. Оператор видит только включённые команды.
          </p>
        </div>
        <span className="machine-details__task-role">{machineRoleLabel}</span>
      </header>

      <div className="machine-commands__layout">
        <div className="machine-commands__column">
          <section className="machine-commands__group">
            <div className="machine-commands__group-head">
              <h3>Системные команды</h3>
              <span>{builtinTemplates.length}</span>
            </div>
            <div className="machine-commands__list">
              {builtinTemplates.map((template) => (
                <article key={template.templateKey} className="machine-commands__card">
                  <div className="machine-commands__card-head">
                    <div>
                      <strong>{template.name}</strong>
                      <p>{template.description || "Системный шаблон платформы."}</p>
                    </div>
                    <span className="machine-commands__badge machine-commands__badge--builtin">
                      Системный
                    </span>
                  </div>
                  <code>{template.commandPattern}</code>
                  <p className="machine-commands__meta">{formatTemplateMeta(template)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="machine-commands__group">
            <div className="machine-commands__group-head">
              <h3>Пользовательские команды</h3>
              <button
                type="button"
                className="machine-details__link-button"
                onClick={resetEditor}
              >
                Новый шаблон
              </button>
            </div>
            <div className="machine-commands__list">
              {customTemplates.length ? (
                customTemplates.map((template) => (
                  <article key={template.templateKey} className="machine-commands__card">
                    <div className="machine-commands__card-head">
                      <div>
                        <strong>{template.name}</strong>
                        <p>{template.description || "Пользовательский шаблон."}</p>
                      </div>
                      <span
                        className={`machine-commands__badge${
                          template.isEnabled
                            ? " machine-commands__badge--enabled"
                            : " machine-commands__badge--disabled"
                        }`}
                      >
                        {template.isEnabled ? "Включён" : "Отключён"}
                      </span>
                    </div>
                    <code>{template.commandPattern}</code>
                    <p className="machine-commands__meta">{formatTemplateMeta(template)}</p>
                    <div className="machine-commands__card-actions">
                      <button
                        type="button"
                        className="machine-details__link-button"
                        onClick={() =>
                          setEditorState(createEditorStateFromTemplate(template))
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="machine-details__inline-action machine-commands__delete"
                        onClick={() => handleDelete(template)}
                        disabled={deletingTemplateId === template.id}
                        aria-label={`Удалить шаблон ${template.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="machine-details__empty">
                  Пользовательских команд пока нет. Добавьте первый безопасный шаблон
                  справа.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="machine-commands__editor">
          <div className="machine-commands__editor-head">
            <div>
              <p className="machine-details__recent-kicker">Редактор шаблона</p>
              <h3>{isEditing ? "Изменить команду" : "Новая команда"}</h3>
            </div>
            {notice ? <p className="profile-card__notice">{notice}</p> : null}
          </div>

          <div className="machine-commands__form">
            <label className="machine-details__task-field">
              <span>Название</span>
              <input
                className="machine-commands__input"
                value={editorState.name}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Например, Docker Compose Up"
              />
            </label>

            <label className="machine-details__task-field">
              <span>Описание</span>
              <input
                className="machine-commands__input"
                value={editorState.description}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Коротко опишите сценарий запуска"
              />
            </label>

            <label className="machine-details__task-field">
              <span>Шаблон команды</span>
              <textarea
                className="machine-commands__textarea"
                value={editorState.commandPattern}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    commandPattern: event.target.value,
                  }))
                }
                placeholder="Например: docker compose {action}"
                rows={4}
              />
            </label>

            <div className="machine-commands__form-grid">
              <label className="machine-details__task-field">
                <span>Парсер результата</span>
                <CustomSelect
                  value={editorState.parserKind}
                  options={parserKindOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  onChange={(value) =>
                    setEditorState((current) => ({
                      ...current,
                      parserKind: value,
                    }))
                  }
                  ariaLabel="Выбор парсера результата"
                />
              </label>

              <label className="machine-details__task-checkbox machine-commands__toggle">
                <input
                  type="checkbox"
                  checked={editorState.isEnabled}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...current,
                      isEnabled: event.target.checked,
                    }))
                  }
                />
                <span>Шаблон доступен для запуска</span>
              </label>
            </div>

            <div className="machine-commands__parameters">
              <div className="machine-commands__group-head">
                <h3>Параметры команды</h3>
                <button
                  type="button"
                  className="machine-details__link-button"
                  onClick={() =>
                    setEditorState((current) => ({
                      ...current,
                      parameters: [...current.parameters, createParameterDraft()],
                    }))
                  }
                >
                  Добавить параметр
                </button>
              </div>

              {editorState.parameters.length ? (
                <div className="machine-commands__parameter-list">
                  {editorState.parameters.map((parameter) => (
                    <div key={parameter.id} className="machine-commands__parameter-row">
                      <input
                        className="machine-commands__input"
                        value={parameter.key}
                        onChange={(event) =>
                          handleParameterChange(parameter.id, "key", event.target.value)
                        }
                        placeholder="key"
                      />
                      <input
                        className="machine-commands__input"
                        value={parameter.label}
                        onChange={(event) =>
                          handleParameterChange(
                            parameter.id,
                            "label",
                            event.target.value,
                          )
                        }
                        placeholder="Название для интерфейса"
                      />
                      <input
                        className="machine-commands__input"
                        value={parameter.allowedValuesText}
                        onChange={(event) =>
                          handleParameterChange(
                            parameter.id,
                            "allowedValuesText",
                            event.target.value,
                          )
                        }
                        placeholder="Варианты через запятую"
                      />
                      <button
                        type="button"
                        className="machine-details__inline-action machine-commands__delete"
                        onClick={() =>
                          setEditorState((current) => ({
                            ...current,
                            parameters: current.parameters.filter(
                              (item) => item.id !== parameter.id,
                            ),
                          }))
                        }
                        aria-label="Удалить параметр"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="machine-details__empty">
                  Добавляйте параметры только там, где они действительно нужны.
                </p>
              )}
            </div>

            <div className="machine-details__task-terminal machine-commands__preview">
              <div className="machine-details__task-terminal-head">
                <span>{shellLabel}</span>
                <span>Пример итоговой строки</span>
              </div>
              <code>{previewCommand}</code>
            </div>

            {error ? <p className="profile-card__error">{error}</p> : null}

            <div className="machine-details__task-actions machine-commands__actions">
              <button
                type="button"
                className="machine-details__link-button"
                onClick={resetEditor}
              >
                Сбросить
              </button>
              <button
                type="button"
                className="machine-details__primary-button"
                disabled={isSaving}
                onClick={handlePersist}
              >
                {isSaving
                  ? "Сохраняем..."
                  : isEditing
                    ? "Сохранить изменения"
                    : "Добавить шаблон"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
