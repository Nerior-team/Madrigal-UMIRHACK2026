import { useEffect, useMemo, useState } from "react";

import {
  api,
  type CommandTemplateMutationInput,
  type CommandTemplateOption,
} from "../../../../core";
import { ApiError } from "../../../../core/http";
import { buildTaskPreview } from "../../../../core/task-preview";
import { CustomSelect } from "../../../primitives/CustomSelect";
import {
  buildCommandPatternFromBase,
  buildGeneratedParameterKey,
  deriveCommandBaseFromPattern,
} from "./template-builder";

type TemplateParameterDraft = {
  id: string;
  label: string;
  allowedValuesText: string;
};

type TemplateEditorState = {
  templateId: string | null;
  name: string;
  description: string;
  commandBase: string;
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

type PreparedParameter = {
  key: string;
  label: string;
  allowedValues: string[];
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
    label: "",
    allowedValuesText: "",
  };
}

function createEmptyEditorState(): TemplateEditorState {
  return {
    templateId: null,
    name: "",
    description: "",
    commandBase: "",
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
    commandBase: template.parameters.length
      ? deriveCommandBaseFromPattern(template.commandPattern)
      : template.commandPattern,
    parserKind: template.parserKind,
    isEnabled: template.isEnabled,
    parameters: template.parameters.map((parameter, index) => ({
      id: `${template.templateKey}-${index}`,
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

function normalizeCommandBase(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatTemplateMeta(template: CommandTemplateOption): string {
  const parameterLabel = template.parameters.length
    ? `${template.parameters.length} параметр${template.parameters.length === 1 ? "" : template.parameters.length < 5 ? "а" : "ов"}`
    : "без параметров";

  return `${parameterLabel} • ${template.runner === "powershell" ? "PowerShell" : "Shell"}`;
}

function prepareParameters(
  drafts: TemplateParameterDraft[],
): PreparedParameter[] {
  return drafts.reduce<PreparedParameter[]>((accumulator, draft) => {
    const label = draft.label.trim();
    const allowedValues = parseAllowedValues(draft.allowedValuesText);
    const hasAnyValue = label || draft.allowedValuesText.trim();

    if (!hasAnyValue) {
      return accumulator;
    }

    accumulator.push({
      key: buildGeneratedParameterKey(accumulator.length),
      label: label || `Параметр ${accumulator.length + 1}`,
      allowedValues,
    });

    return accumulator;
  }, []);
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
  const preparedParameters = useMemo(
    () => prepareParameters(editorState.parameters),
    [editorState.parameters],
  );
  const generatedCommandPattern = useMemo(
    () =>
      buildCommandPatternFromBase(
        editorState.commandBase,
        preparedParameters.map((parameter) => parameter.key),
      ),
    [editorState.commandBase, preparedParameters],
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
    const params = preparedParameters.reduce<Record<string, string>>(
      (accumulator, parameter) => {
        accumulator[parameter.key] =
          parameter.allowedValues[0] ?? `{${parameter.key}}`;
        return accumulator;
      },
      {},
    );

    return (
      buildTaskPreview({
        commandPattern: generatedCommandPattern,
        params,
        useSudo: false,
      }) || "Введите команду и параметры, чтобы увидеть итоговую строку."
    );
  }, [generatedCommandPattern, preparedParameters]);

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

    if (!normalizeCommandBase(editorState.commandBase)) {
      setError("Укажите базовую команду.");
      return;
    }

    const parameters: CommandTemplateMutationInput["parameters"] = [];
    for (const draft of editorState.parameters) {
      const label = draft.label.trim();
      const allowedValues = parseAllowedValues(draft.allowedValuesText);
      const hasAnyValue = label || draft.allowedValuesText.trim();

      if (!hasAnyValue) {
        continue;
      }

      if (!label) {
        setError("У каждого параметра должно быть понятное название для интерфейса.");
        return;
      }

      if (!allowedValues.length) {
        setError(`У параметра «${label}» должен быть хотя бы один вариант.`);
        return;
      }

      parameters.push({
        key: buildGeneratedParameterKey(parameters.length),
        label,
        allowedValues,
      });
    }

    const payload: CommandTemplateMutationInput = {
      name: editorState.name.trim(),
      description: editorState.description.trim() || null,
      runner: resolveRunner(machineOs),
      commandPattern: buildCommandPatternFromBase(
        editorState.commandBase,
        parameters.map((parameter) => parameter.key),
      ),
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
          ? "Команда обновлена."
          : "Команда добавлена и уже доступна для запуска задач.",
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
      setNotice(`Шаблон «${template.name}» удален.`);
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
            {machineName}. Оператор видит только включенные команды.
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
                Новая команда
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
                        {template.isEnabled ? "Включен" : "Отключен"}
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
                  Пользовательских команд пока нет. Добавьте первый безопасный
                  шаблон справа.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="machine-commands__editor">
          <div className="machine-commands__editor-head">
            <div>
              <p className="machine-details__recent-kicker">Редактор команды</p>
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
                placeholder="Например, Docker Compose"
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
              <span>Команда</span>
              <input
                className="machine-commands__input"
                value={editorState.commandBase}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    commandBase: event.target.value,
                  }))
                }
                placeholder="Например: docker compose"
              />
            </label>

            <p className="machine-commands__hint">
              Параметры автоматически добавляются к команде в указанном порядке.
            </p>

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
                <span>Команда доступна для запуска</span>
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
                  {editorState.parameters.map((parameter, index) => (
                    <div key={parameter.id} className="machine-commands__parameter-row">
                      <div className="machine-commands__parameter-meta">
                        <span className="machine-commands__parameter-chip">
                          Параметр {index + 1}
                        </span>
                        <span className="machine-commands__parameter-note">
                          В backend уйдет как {buildGeneratedParameterKey(index)}
                        </span>
                      </div>
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

            <div className="machine-commands__template-preview">
              <span>Шаблон команды</span>
              <code>
                {generatedCommandPattern || "Введите команду, чтобы подготовить шаблон."}
              </code>
            </div>

            <div className="machine-details__task-terminal machine-commands__preview">
              <div className="machine-details__task-terminal-head">
                <span>{shellLabel}</span>
                <span>Итоговая строка запуска</span>
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
                    : "Добавить команду"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
