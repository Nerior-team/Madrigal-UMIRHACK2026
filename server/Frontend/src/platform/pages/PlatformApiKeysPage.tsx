import { useMemo } from "react";
import { CustomSelect } from "../../components/primitives/CustomSelect";
import { formatMoscowDateTime } from "../../core/ui";
import type { PlatformAuthState, PlatformCommandScopeOption } from "../api/platform";
import { PlatformSectionCard } from "../components/PlatformSectionCard";

type PlatformApiKeysPageProps = {
  authState: PlatformAuthState;
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
  { value: "read", label: "Read only" },
  { value: "run", label: "Read + run tasks" },
] as const;

const EXPIRY_OPTIONS = [
  { value: "one_time", label: "One-time" },
  { value: "day", label: "24 hours" },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
  { value: "year", label: "1 year" },
  { value: "unlimited", label: "No expiry" },
] as const;

function formatKeyDate(value?: string | null): string {
  return value ? formatMoscowDateTime(value) : "Not used yet";
}

export function PlatformApiKeysPage({
  authState,
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
  const selectedMachineTitles = useMemo(
    () =>
      machineOptions
        .filter((machine) => form.machineIds.includes(machine.id))
        .map((machine) => machine.title),
    [form.machineIds, machineOptions],
  );

  if (authState !== "authenticated") {
    return (
      <PlatformSectionCard
        eyebrow="Authentication"
        title="Sign in to manage developer keys"
        detail="The docs remain public, but key creation, revocation, and usage analytics are tied to your product account."
      >
        <a className="platform-button platform-button--primary" href="https://nerior.store/login">
          Sign in on nerior.store
        </a>
      </PlatformSectionCard>
    );
  }

  return (
    <div className="platform-page platform-page--keys">
      <section className="platform-two-column platform-two-column--wide">
        <PlatformSectionCard
          eyebrow="Create"
          title="Issue a new API key"
          detail="Scopes stay explicit: select machines first, then narrow available command templates if needed."
        >
          <div className="platform-form-grid">
            <label className="platform-field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Production sync worker"
              />
            </label>

            <label className="platform-field">
              <span>Permission</span>
              <CustomSelect
                value={form.permission}
                options={[...PERMISSION_OPTIONS]}
                onChange={(value) => onFieldChange("permission", value)}
                ariaLabel="API key permission"
                className="platform-select"
              />
            </label>

            <label className="platform-field">
              <span>Expiry</span>
              <CustomSelect
                value={form.expiryPreset}
                options={[...EXPIRY_OPTIONS]}
                onChange={(value) => onFieldChange("expiryPreset", value)}
                ariaLabel="API key expiry"
                className="platform-select"
              />
            </label>

            <label className="platform-field">
              <span>Confirm with password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => onFieldChange("password", event.target.value)}
                placeholder="Account password"
              />
            </label>
          </div>

          <div className="platform-scope-panel">
            <div className="platform-scope-panel__header">
              <strong>Machine scope</strong>
              <span>{selectedMachineTitles.length ? selectedMachineTitles.join(" / ") : "Select at least one machine"}</span>
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
              <strong>Command scope</strong>
              <span>
                {commandScopeOptions.length
                  ? "Optional allowlist, narrowed to the machines you selected."
                  : "Command scopes appear after machine selection."}
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
              <span>Copy now: raw key is shown once</span>
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
              {isSubmitting ? "Issuing key..." : "Issue API key"}
            </button>
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          eyebrow="Inventory"
          title="Existing keys"
          detail="Usage and expiry metadata come directly from the backend API-key records."
        >
          <div className="platform-key-list">
            {apiKeys.length ? (
              apiKeys.map((item) => (
                <article key={item.id} className="platform-key-card">
                  <div className="platform-key-card__header">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.permission === "run" ? "Read + run tasks" : "Read only"}</p>
                    </div>
                    <span className={item.isActive ? "platform-badge platform-badge--active" : "platform-badge"}>
                      {item.isActive ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <dl className="platform-key-card__meta">
                    <div>
                      <dt>Public ID</dt>
                      <dd>{item.publicId}</dd>
                    </div>
                    <div>
                      <dt>Usage</dt>
                      <dd>{item.usesCount} calls</dd>
                    </div>
                    <div>
                      <dt>Last used</dt>
                      <dd>{formatKeyDate(item.lastUsedAt)}</dd>
                    </div>
                    <div>
                      <dt>Last IP</dt>
                      <dd>{item.lastUsedIp || "Unavailable"}</dd>
                    </div>
                    <div>
                      <dt>Expiry</dt>
                      <dd>{item.expiresAt ? formatMoscowDateTime(item.expiresAt) : "No expiry"}</dd>
                    </div>
                    <div>
                      <dt>Scopes</dt>
                      <dd>{`${item.machineIds.length} machines / ${item.allowedTemplateKeys.length || "all"} command sets`}</dd>
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
                        {isRevoking ? "Revoking..." : "Revoke key"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="platform-empty-state">No API keys yet. Create the first key to unlock programmatic access.</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
