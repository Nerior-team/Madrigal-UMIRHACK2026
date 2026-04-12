import { Activity, KeyRound, ShieldCheck, TimerReset } from "lucide-react";
import { useMemo } from "react";

import type {
  AccountMachineScopeOption,
  ApiKeyExpiryPreset,
  ApiKeyPermission,
  ApiKeyRead,
} from "../../core/account";
import {
  getApiKeyExpiryLabel,
  getApiKeyPermissionLabel,
} from "../../core/account-ui";
import { formatMoscowDateTime } from "../../core/ui";
import { CustomSelect } from "../primitives/CustomSelect";

type ApiKeysWorkspaceProps = {
  items: ApiKeyRead[];
  machineOptions: AccountMachineScopeOption[];
  isLoading: boolean;
  isSubmitting: boolean;
  isRevoking: boolean;
  createForm: {
    name: string;
    permission: ApiKeyPermission;
    expiryPreset: ApiKeyExpiryPreset;
    machineIds: string[];
    templateKeysText: string;
    reauthPassword: string;
  };
  latestRawKey?: string | null;
  notice?: string | null;
  error?: string | null;
  onFieldChange: (
    field:
      | "name"
      | "permission"
      | "expiryPreset"
      | "templateKeysText"
      | "reauthPassword",
    value: string,
  ) => void;
  onToggleMachine: (machineId: string) => void;
  onCreate: () => void;
  onRevoke: (keyId: string) => void;
};

const API_KEY_EXPIRY_VALUES: ApiKeyExpiryPreset[] = [
  "one_time",
  "day",
  "week",
  "month",
  "year",
  "unlimited",
];

const API_KEY_EXPIRY_OPTIONS = API_KEY_EXPIRY_VALUES.map((value) => ({
  value,
  label: getApiKeyExpiryLabel(value),
}));

const API_KEY_PERMISSION_VALUES: ApiKeyPermission[] = ["read", "run"];

const API_KEY_PERMISSION_OPTIONS = API_KEY_PERMISSION_VALUES.map((value) => ({
  value,
  label: getApiKeyPermissionLabel(value),
}));

function formatApiKeyDate(value?: string | null): string {
  return value ? formatMoscowDateTime(value) : "Нет данных";
}

function formatTemplateScope(templateKeys: string[]): string {
  return templateKeys.length ? templateKeys.join(", ") : "Без ограничений";
}

export function ApiKeysWorkspace({
  items,
  machineOptions,
  isLoading,
  isSubmitting,
  isRevoking,
  createForm,
  latestRawKey,
  notice,
  error,
  onFieldChange,
  onToggleMachine,
  onCreate,
  onRevoke,
}: ApiKeysWorkspaceProps) {
  const stats = useMemo(() => {
    const activeItems = items.filter((item) => item.isActive);
    const totalUses = items.reduce((sum, item) => sum + item.usesCount, 0);
    const runEnabled = items.filter((item) => item.permission === "run").length;
    const limitedItems = items.filter((item) => item.expiresAt).length;
    const chartItems = [...items]
      .sort((left, right) => right.usesCount - left.usesCount)
      .slice(0, 5);
    const chartMax = Math.max(1, ...chartItems.map((item) => item.usesCount || 0));

    return {
      total: items.length,
      active: activeItems.length,
      totalUses,
      runEnabled,
      limitedItems,
      chartItems,
      chartMax,
    };
  }, [items]);

  return (
    <section className="profile-card profile-card--api-keys">
      <header className="profile-card__header">
        <h3>API-ключи</h3>
        <p>
          Новый ключ показывается один раз. Сразу сохраните его в безопасное
          место и выдавайте только минимально нужные права.
        </p>
      </header>

      <div className="profile-api-stats">
        <article className="profile-api-stat-card">
          <span className="profile-api-stat-card__icon" aria-hidden="true">
            <KeyRound size={18} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <span>Всего ключей</span>
          </div>
        </article>
        <article className="profile-api-stat-card">
          <span className="profile-api-stat-card__icon" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{stats.active}</strong>
            <span>Активных</span>
          </div>
        </article>
        <article className="profile-api-stat-card">
          <span className="profile-api-stat-card__icon" aria-hidden="true">
            <Activity size={18} />
          </span>
          <div>
            <strong>{stats.totalUses}</strong>
            <span>Всего использований</span>
          </div>
        </article>
        <article className="profile-api-stat-card">
          <span className="profile-api-stat-card__icon" aria-hidden="true">
            <TimerReset size={18} />
          </span>
          <div>
            <strong>{stats.limitedItems}</strong>
            <span>Со сроком действия</span>
          </div>
        </article>
      </div>

      <div className="profile-api-layout">
        <article className="profile-api-form">
          <div className="profile-fields">
            <label className="profile-field">
              <span>Название ключа</span>
              <input
                type="text"
                value={createForm.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Например, CI deploy"
              />
            </label>

            <label className="profile-field">
              <span>Право</span>
              <CustomSelect
                value={createForm.permission}
                options={API_KEY_PERMISSION_OPTIONS}
                onChange={(value) => onFieldChange("permission", value)}
                ariaLabel="Права API-ключа"
              />
            </label>

            <label className="profile-field">
              <span>Срок</span>
              <CustomSelect
                value={createForm.expiryPreset}
                options={API_KEY_EXPIRY_OPTIONS}
                onChange={(value) => onFieldChange("expiryPreset", value)}
                ariaLabel="Срок действия API-ключа"
              />
            </label>

            <label className="profile-field">
              <span>Разрешенные команды</span>
              <input
                type="text"
                value={createForm.templateKeysText}
                onChange={(event) =>
                  onFieldChange("templateKeysText", event.target.value)
                }
                placeholder="system:basic_diagnostics, system:memory_usage"
              />
            </label>

            <label className="profile-field">
              <span>Подтвердите паролем</span>
              <input
                type="password"
                value={createForm.reauthPassword}
                onChange={(event) =>
                  onFieldChange("reauthPassword", event.target.value)
                }
                placeholder="Пароль аккаунта"
              />
            </label>
          </div>

          <div className="profile-api-machines">
            <div className="profile-api-machines__header">
              <strong>Область по машинам</strong>
              <span>
                {createForm.machineIds.length
                  ? `Выбрано: ${createForm.machineIds.length}`
                  : "Если не выбрать ничего, ключ останется без доступа к машинам."}
              </span>
            </div>
            <div className="profile-api-machines__list">
              {machineOptions.map((machine) => {
                const checked = createForm.machineIds.includes(machine.id);

                return (
                  <label
                    key={machine.id}
                    className={
                      checked
                        ? "profile-api-machine profile-api-machine--selected"
                        : "profile-api-machine"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleMachine(machine.id)}
                    />
                    <span>{machine.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {notice ? <p className="profile-card__notice">{notice}</p> : null}
          {error ? <p className="profile-card__error">{error}</p> : null}
          {latestRawKey ? (
            <label className="profile-field">
              <span>Новый ключ</span>
              <textarea value={latestRawKey} readOnly rows={3} />
            </label>
          ) : null}

          <div className="profile-card__actions">
            <button
              type="button"
              className="profile-action-button"
              onClick={onCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Создаем..." : "Создать ключ"}
            </button>
          </div>
        </article>

        <div className="profile-api-side">
          <article className="profile-api-analytics">
            <div className="profile-api-list__header">
              <strong>Активность</strong>
              <span>{stats.runEnabled} ключей с запуском команд</span>
            </div>

            {stats.chartItems.length ? (
              <div className="profile-api-usage-chart">
                {stats.chartItems.map((item) => {
                  const fill = Math.max(
                    item.usesCount ? 10 : 4,
                    Math.round((item.usesCount / stats.chartMax) * 100),
                  );

                  return (
                    <article key={item.id} className="profile-api-usage-chart__row">
                      <div className="profile-api-usage-chart__label">
                        <strong>{item.name}</strong>
                        <span>{`${item.usesCount} вызовов`}</span>
                      </div>
                      <div className="profile-api-usage-chart__track">
                        <div
                          className="profile-api-usage-chart__fill"
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="profile-api-list__empty">Использований пока нет.</p>
            )}
          </article>

          <article className="profile-api-list">
            <div className="profile-api-list__header">
              <strong>Созданные ключи</strong>
              <span>{isLoading ? "Загрузка..." : `${items.length} шт.`}</span>
            </div>

            <div className="profile-api-list__items">
              {items.length ? (
                items.map((item) => (
                  <article key={item.id} className="profile-api-row">
                    <div className="profile-api-row__meta">
                      <div className="profile-api-row__headline">
                        <strong>{item.name}</strong>
                        <span
                          className={
                            item.isActive
                              ? "profile-api-row__status profile-api-row__status--active"
                              : "profile-api-row__status"
                          }
                        >
                          {item.isActive ? "Активен" : "Отключен"}
                        </span>
                      </div>
                      <p>{`${getApiKeyPermissionLabel(item.permission)} • Использований: ${item.usesCount}`}</p>
                      <p>{`Срок: ${item.expiresAt ? formatApiKeyDate(item.expiresAt) : "Без срока"}`}</p>
                      <p>{`Последний вызов: ${formatApiKeyDate(item.lastUsedAt)}`}</p>
                      <p>{`Публичный ID: ${item.publicId}`}</p>
                      <p>{`Машин: ${item.machineIds.length} • Команды: ${formatTemplateScope(item.allowedTemplateKeys)}`}</p>
                    </div>

                    <div className="profile-api-row__actions">
                      {item.isActive ? (
                        <button
                          type="button"
                          onClick={() => onRevoke(item.id)}
                          disabled={isRevoking}
                        >
                          Отозвать
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="profile-api-list__empty">API-ключей пока нет.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
