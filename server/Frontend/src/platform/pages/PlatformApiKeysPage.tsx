import { useMemo } from "react";
import { CustomSelect } from "../../components/primitives/CustomSelect";
import { formatMoscowDateTime } from "../../core/ui";
import type { PlatformCommandScopeOption } from "../api/platform";
import { PlatformSectionCard } from "../components/PlatformSectionCard";
import { PLATFORM_PRODUCTS } from "../products";

type PlatformApiKeysPageProps = {
  apiKeys: Array<{
    id: string;
    name: string;
    permission: "read" | "run";
    machineIds: string[];
    allowedTemplateKeys: string[];
    usesCount: number;
    expiresAt?: string | null;
    lastUsedAt?: string | null;
    lastUsedIp?: string | null;
    publicId: string;
    isActive: boolean;
  }>;
  machineOptions: Array<{ id: string; title: string }>;
  commandScopeOptions: PlatformCommandScopeOption[];
  form: {
    name: string;
    permission: "read" | "run";
    expiryPreset: "one_time" | "day" | "week" | "month" | "year" | "unlimited";
    machineIds: string[];
    templateKeys: string[];
    password: string;
  };
  latestRawKey: string | null;
  notice: string | null;
  error: string | null;
  isSubmitting: boolean;
  isRevoking: boolean;
  onFieldChange: (
    field: "name" | "permission" | "expiryPreset" | "password",
    value: string,
  ) => void;
  onToggleMachine: (machineId: string) => void;
  onToggleTemplate: (templateKey: string) => void;
  onCreate: () => void;
  onRevoke: (keyId: string) => void;
};

const PERMISSION_OPTIONS = [
  { value: "read", label: "Только чтение" },
  { value: "run", label: "Чтение и запуск задач" },
] as const;

const EXPIRY_OPTIONS = [
  { value: "one_time", label: "Одно использование" },
  { value: "day", label: "24 часа" },
  { value: "week", label: "7 дней" },
  { value: "month", label: "30 дней" },
  { value: "year", label: "1 год" },
  { value: "unlimited", label: "Без срока" },
] as const;

function formatKeyDate(value?: string | null): string {
  return value ? formatMoscowDateTime(value) : "Ещё не использовался";
}

export function PlatformApiKeysPage({
  apiKeys,
  machineOptions,
  commandScopeOptions,
  form,
  latestRawKey,
  notice,
  error,
  isSubmitting,
  isRevoking,
  onFieldChange,
  onToggleMachine,
  onToggleTemplate,
  onCreate,
  onRevoke,
}: PlatformApiKeysPageProps) {
  const activeProduct = PLATFORM_PRODUCTS.find((item) => item.status === "available");

  const selectedMachineTitles = useMemo(
    () =>
      machineOptions
        .filter((machine) => form.machineIds.includes(machine.id))
        .map((machine) => machine.title),
    [form.machineIds, machineOptions],
  );

  return (
    <div className="platform-page platform-page--keys">
      <PlatformSectionCard
        eyebrow="Продукты"
        title="Доступные сервисы"
        detail="Выпуск API-ключей уже работает для Crossplat. Остальные сервисы показаны заранее, но пока недоступны."
      >
        <div className="platform-product-grid">
          {PLATFORM_PRODUCTS.map((product) => (
            <article
              key={product.key}
              className={
                product.status === "available"
                  ? "platform-product-card"
                  : "platform-product-card platform-product-card--disabled"
              }
            >
              <div className="platform-product-card__header">
                <strong>{product.name}</strong>
                <span
                  className={
                    product.status === "available"
                      ? "platform-badge platform-badge--active"
                      : "platform-badge"
                  }
                >
                  {product.note}
                </span>
              </div>
              <p>{product.description}</p>
            </article>
          ))}
        </div>
      </PlatformSectionCard>

      <section className="platform-two-column platform-two-column--wide">
        <PlatformSectionCard
          eyebrow="Создание"
          title="Выпуск API-ключа Crossplat"
          detail="Scope остаётся явным: сначала выбираются машины, затем при необходимости сужаются шаблоны команд."
        >
          <div className="platform-form-grid">
            <label className="platform-field">
              <span>Название</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Например, production sync worker"
              />
            </label>

            <label className="platform-field">
              <span>Разрешение</span>
              <CustomSelect
                value={form.permission}
                options={[...PERMISSION_OPTIONS]}
                onChange={(value) => onFieldChange("permission", value)}
                ariaLabel="Разрешение API-ключа"
                className="platform-select"
              />
            </label>

            <label className="platform-field">
              <span>Срок действия</span>
              <CustomSelect
                value={form.expiryPreset}
                options={[...EXPIRY_OPTIONS]}
                onChange={(value) => onFieldChange("expiryPreset", value)}
                ariaLabel="Срок действия API-ключа"
                className="platform-select"
              />
            </label>

            <label className="platform-field">
              <span>Сервис</span>
              <input type="text" value={activeProduct?.name ?? "Crossplat"} readOnly />
            </label>

            <label className="platform-field">
              <span>Подтвердите паролем</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => onFieldChange("password", event.target.value)}
                placeholder="Пароль аккаунта"
              />
            </label>
          </div>

          <div className="platform-scope-panel">
            <div className="platform-scope-panel__header">
              <strong>Scope машин</strong>
              <span>{selectedMachineTitles.length ? selectedMachineTitles.join(" / ") : "Выберите хотя бы одну машину Crossplat"}</span>
            </div>
            <div className="platform-chip-grid">
              {machineOptions.map((machine) => {
                const selected = form.machineIds.includes(machine.id);
                return (
                  <button
                    key={machine.id}
                    type="button"
                    className={selected ? "platform-chip platform-chip--selected" : "platform-chip"}
                    onClick={() => onToggleMachine(machine.id)}
                  >
                    {machine.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="platform-scope-panel">
            <div className="platform-scope-panel__header">
              <strong>Scope команд</strong>
              <span>
                {commandScopeOptions.length
                  ? "Необязательный allowlist, уже суженный до выбранных машин."
                  : "Scope команд появится после выбора машин Crossplat."}
              </span>
            </div>
            <div className="platform-chip-grid">
              {commandScopeOptions.map((item) => {
                const selected = form.templateKeys.includes(item.templateKey);
                return (
                  <button
                    key={item.templateKey}
                    type="button"
                    className={selected ? "platform-chip platform-chip--selected" : "platform-chip"}
                    onClick={() => onToggleTemplate(item.templateKey)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.machineTitles.join(" / ")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {notice ? <p className="platform-feedback platform-feedback--notice">{notice}</p> : null}
          {error ? <p className="platform-feedback platform-feedback--error">{error}</p> : null}
          {latestRawKey ? (
            <label className="platform-field">
              <span>Скопируйте сейчас: raw key показывается один раз</span>
              <textarea readOnly value={latestRawKey} rows={3} />
            </label>
          ) : null}

          <div className="platform-actions">
            <button
              type="button"
              className="platform-button platform-button--primary"
              onClick={onCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Выпускаем ключ..." : "Выпустить ключ"}
            </button>
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Реестр"
          title="Существующие ключи"
          detail="Метаданные usage и expiry приходят напрямую из backend-записей API-ключей."
        >
          <div className="platform-key-list">
            {apiKeys.length ? (
              apiKeys.map((item) => (
                <article key={item.id} className="platform-key-card">
                  <div className="platform-key-card__header">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.permission === "run" ? "Чтение и запуск задач" : "Только чтение"}</p>
                    </div>
                    <span className={item.isActive ? "platform-badge platform-badge--active" : "platform-badge"}>
                      {item.isActive ? "Активен" : "Отозван"}
                    </span>
                  </div>
                  <dl className="platform-key-card__meta">
                    <div>
                      <dt>Public ID</dt>
                      <dd>{item.publicId}</dd>
                    </div>
                    <div>
                      <dt>Использование</dt>
                      <dd>{item.usesCount} вызовов</dd>
                    </div>
                    <div>
                      <dt>Последнее использование</dt>
                      <dd>{formatKeyDate(item.lastUsedAt)}</dd>
                    </div>
                    <div>
                      <dt>Последний IP</dt>
                      <dd>{item.lastUsedIp || "Недоступно"}</dd>
                    </div>
                    <div>
                      <dt>Срок действия</dt>
                      <dd>{item.expiresAt ? formatMoscowDateTime(item.expiresAt) : "Без срока"}</dd>
                    </div>
                    <div>
                      <dt>Scope</dt>
                      <dd>{`${item.machineIds.length} машин / ${item.allowedTemplateKeys.length || "все"} наборов команд`}</dd>
                    </div>
                  </dl>

                  {item.isActive ? (
                    <div className="platform-actions">
                      <button
                        type="button"
                        className="platform-button"
                        disabled={isRevoking}
                        onClick={() => onRevoke(item.id)}
                      >
                        {isRevoking ? "Отзываем..." : "Отозвать ключ"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="platform-empty-state">API-ключей пока нет. Выпустите первый ключ, чтобы открыть доступ к Crossplat.</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
