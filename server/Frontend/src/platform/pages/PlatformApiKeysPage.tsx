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
  { value: "read", label: "\u0422\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u0435\u043d\u0438\u0435" },
  { value: "run", label: "\u0427\u0442\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u043f\u0443\u0441\u043a \u0437\u0430\u0434\u0430\u0447" },
] as const;

const EXPIRY_OPTIONS = [
  { value: "one_time", label: "\u041e\u0434\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435" },
  { value: "day", label: "24 \u0447\u0430\u0441\u0430" },
  { value: "week", label: "7 \u0434\u043d\u0435\u0439" },
  { value: "month", label: "30 \u0434\u043d\u0435\u0439" },
  { value: "year", label: "1 \u0433\u043e\u0434" },
  { value: "unlimited", label: "\u0411\u0435\u0437 \u0441\u0440\u043e\u043a\u0430" },
] as const;

function formatKeyDate(value?: string | null): string {
  return value ? formatMoscowDateTime(value) : "\u0415\u0449\u0451 \u043d\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043b\u0441\u044f";
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
        eyebrow={"\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b"}
        title={"\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u044b"}
        detail={"\u0412\u044b\u043f\u0443\u0441\u043a API-\u043a\u043b\u044e\u0447\u0435\u0439 \u0443\u0436\u0435 \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0434\u043b\u044f Crossplat. \u041e\u0441\u0442\u0430\u043b\u044c\u043d\u044b\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u044b \u043f\u043e\u043a\u0430\u0437\u0430\u043d\u044b \u0437\u0430\u0440\u0430\u043d\u0435\u0435, \u043d\u043e \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b."}
      >
        <div className="platform-product-grid">
          {PLATFORM_PRODUCTS.map((product) => (
            <article
              key={product.key}
              className={product.status === "available" ? "platform-product-card" : "platform-product-card platform-product-card--disabled"}
            >
              <div className="platform-product-card__header">
                <strong>{product.name}</strong>
                <span className={product.status === "available" ? "platform-badge platform-badge--active" : "platform-badge"}>
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
          eyebrow={"\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435"}
          title={"\u0412\u044b\u043f\u0443\u0441\u043a API-\u043a\u043b\u044e\u0447\u0430 Crossplat"}
          detail={"Scope \u043e\u0441\u0442\u0430\u0451\u0442\u0441\u044f \u044f\u0432\u043d\u044b\u043c: \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0438\u0440\u0430\u044e\u0442\u0441\u044f \u043c\u0430\u0448\u0438\u043d\u044b, \u0437\u0430\u0442\u0435\u043c \u043f\u0440\u0438 \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e\u0441\u0442\u0438 \u0441\u0443\u0436\u0430\u044e\u0442\u0441\u044f \u0448\u0430\u0431\u043b\u043e\u043d\u044b \u043a\u043e\u043c\u0430\u043d\u0434."}
        >
          <div className="platform-form-grid">
            <label className="platform-field">
              <span>{"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435"}</span>
              <input type="text" value={form.name} onChange={(event) => onFieldChange("name", event.target.value)} placeholder="production sync worker" />
            </label>

            <label className="platform-field">
              <span>{"\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u0435"}</span>
              <CustomSelect value={form.permission} options={[...PERMISSION_OPTIONS]} onChange={(value) => onFieldChange("permission", value)} ariaLabel={"\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u0435 API-\u043a\u043b\u044e\u0447\u0430"} className="platform-select" />
            </label>

            <label className="platform-field">
              <span>{"\u0421\u0440\u043e\u043a \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f"}</span>
              <CustomSelect value={form.expiryPreset} options={[...EXPIRY_OPTIONS]} onChange={(value) => onFieldChange("expiryPreset", value)} ariaLabel={"\u0421\u0440\u043e\u043a \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f API-\u043a\u043b\u044e\u0447\u0430"} className="platform-select" />
            </label>

            <label className="platform-field">
              <span>{"\u0421\u0435\u0440\u0432\u0438\u0441"}</span>
              <input type="text" value={activeProduct?.name ?? "Crossplat"} readOnly />
            </label>

            <label className="platform-field">
              <span>{"\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u0435\u043c"}</span>
              <input type="password" value={form.password} onChange={(event) => onFieldChange("password", event.target.value)} placeholder={"\u041f\u0430\u0440\u043e\u043b\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430"} />
            </label>
          </div>

          <div className="platform-scope-panel">
            <div className="platform-scope-panel__header">
              <strong>{"Scope \u043c\u0430\u0448\u0438\u043d"}</strong>
              <span>
                {selectedMachineTitles.length ? selectedMachineTitles.join(" / ") : "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u043d\u0443 \u043c\u0430\u0448\u0438\u043d\u0443 Crossplat"}
              </span>
            </div>
            <div className="platform-chip-grid">
              {machineOptions.map((machine) => {
                const selected = form.machineIds.includes(machine.id);
                return (
                  <button key={machine.id} type="button" className={selected ? "platform-chip platform-chip--selected" : "platform-chip"} onClick={() => onToggleMachine(machine.id)}>
                    {machine.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="platform-scope-panel">
            <div className="platform-scope-panel__header">
              <strong>{"Scope \u043a\u043e\u043c\u0430\u043d\u0434"}</strong>
              <span>
                {commandScopeOptions.length
                  ? "\u041d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 allowlist, \u0443\u0436\u0435 \u0441\u0443\u0436\u0435\u043d\u043d\u044b\u0439 \u0434\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0445 \u043c\u0430\u0448\u0438\u043d."
                  : "Scope \u043a\u043e\u043c\u0430\u043d\u0434 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u0432\u044b\u0431\u043e\u0440\u0430 \u043c\u0430\u0448\u0438\u043d Crossplat."}
              </span>
            </div>
            <div className="platform-chip-grid">
              {commandScopeOptions.map((item) => {
                const selected = form.templateKeys.includes(item.templateKey);
                return (
                  <button key={item.templateKey} type="button" className={selected ? "platform-chip platform-chip--selected" : "platform-chip"} onClick={() => onToggleTemplate(item.templateKey)}>
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
              <span>{"\u0421\u043a\u043e\u043f\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0435\u0439\u0447\u0430\u0441: raw key \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043e\u0434\u0438\u043d \u0440\u0430\u0437"}</span>
              <textarea readOnly value={latestRawKey} rows={3} />
            </label>
          ) : null}

          <div className="platform-actions">
            <button type="button" className="platform-button platform-button--primary" onClick={onCreate} disabled={isSubmitting}>
              {isSubmitting ? "\u0412\u044b\u043f\u0443\u0441\u043a\u0430\u0435\u043c \u043a\u043b\u044e\u0447..." : "\u0412\u044b\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u043a\u043b\u044e\u0447"}
            </button>
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard eyebrow={"\u0420\u0435\u0435\u0441\u0442\u0440"} title={"\u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0435 \u043a\u043b\u044e\u0447\u0438"} detail={"\u041c\u0435\u0442\u0430\u0434\u0430\u043d\u043d\u044b\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f \u0438 expiry \u043f\u0440\u0438\u0445\u043e\u0434\u044f\u0442 \u043d\u0430\u043f\u0440\u044f\u043c\u0443\u044e \u0438\u0437 backend-\u0437\u0430\u043f\u0438\u0441\u0435\u0439 API-\u043a\u043b\u044e\u0447\u0435\u0439."}>
          <div className="platform-key-list">
            {apiKeys.length ? (
              apiKeys.map((item) => (
                <article key={item.id} className="platform-key-card">
                  <div className="platform-key-card__header">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.permission === "run" ? "\u0427\u0442\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u043f\u0443\u0441\u043a \u0437\u0430\u0434\u0430\u0447" : "\u0422\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u0435\u043d\u0438\u0435"}</p>
                    </div>
                    <span className={item.isActive ? "platform-badge platform-badge--active" : "platform-badge"}>
                      {item.isActive ? "\u0410\u043a\u0442\u0438\u0432\u0435\u043d" : "\u041e\u0442\u043e\u0437\u0432\u0430\u043d"}
                    </span>
                  </div>
                  <dl className="platform-key-card__meta">
                    <div><dt>Public ID</dt><dd>{item.publicId}</dd></div>
                    <div><dt>{"\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435"}</dt><dd>{`${item.usesCount} \u0432\u044b\u0437\u043e\u0432\u043e\u0432`}</dd></div>
                    <div><dt>{"\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435"}</dt><dd>{formatKeyDate(item.lastUsedAt)}</dd></div>
                    <div><dt>{"\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 IP"}</dt><dd>{item.lastUsedIp || "\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e"}</dd></div>
                    <div><dt>{"\u0421\u0440\u043e\u043a \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f"}</dt><dd>{item.expiresAt ? formatMoscowDateTime(item.expiresAt) : "\u0411\u0435\u0437 \u0441\u0440\u043e\u043a\u0430"}</dd></div>
                    <div><dt>Scope</dt><dd>{`${item.machineIds.length} \u043c\u0430\u0448\u0438\u043d / ${item.allowedTemplateKeys.length || "\u0432\u0441\u0435"} \u043d\u0430\u0431\u043e\u0440\u043e\u0432 \u043a\u043e\u043c\u0430\u043d\u0434`}</dd></div>
                  </dl>

                  {item.isActive ? (
                    <div className="platform-actions">
                      <button type="button" className="platform-button" disabled={isRevoking} onClick={() => onRevoke(item.id)}>
                        {isRevoking ? "\u041e\u0442\u0437\u044b\u0432\u0430\u0435\u043c..." : "\u041e\u0442\u043e\u0437\u0432\u0430\u0442\u044c \u043a\u043b\u044e\u0447"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="platform-empty-state">{"\u0041\u0050\u0049-\u043a\u043b\u044e\u0447\u0435\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u0412\u044b\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u043f\u0435\u0440\u0432\u044b\u0439 \u043a\u043b\u044e\u0447, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f \u043a Crossplat."}</p>
            )}
          </div>
        </PlatformSectionCard>
      </section>
    </div>
  );
}
