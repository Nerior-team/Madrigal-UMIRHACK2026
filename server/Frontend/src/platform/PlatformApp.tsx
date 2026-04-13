import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ApiKeyExpiryPreset, ApiKeyPermission, ApiKeyRead } from "../core";
import { ApiError } from "../core/http";
import {
  buildPlatformApiKeyStats,
  createPlatformApiKey,
  getPlatformDashboard,
  listPlatformCommandScopeOptions,
  revokePlatformApiKey,
  type PlatformCommandScopeOption,
  type PlatformDashboardData,
} from "./api/platform";
import { PlatformShell } from "./components/PlatformShell";
import { PlatformAnalyticsPage } from "./pages/PlatformAnalyticsPage";
import { PlatformApiKeysPage } from "./pages/PlatformApiKeysPage";
import { PlatformDocsPage } from "./pages/PlatformDocsPage";
import { PlatformOverviewPage } from "./pages/PlatformOverviewPage";
import { resolvePlatformRoute } from "./routes";

type PlatformKeyForm = {
  name: string;
  permission: ApiKeyPermission;
  expiryPreset: ApiKeyExpiryPreset;
  machineIds: string[];
  templateKeys: string[];
  password: string;
};

const INITIAL_FORM: PlatformKeyForm = {
  name: "",
  permission: "read",
  expiryPreset: "month",
  machineIds: [],
  templateKeys: [],
  password: "",
};

export function PlatformApp() {
  const location = useLocation();
  const route = resolvePlatformRoute(location.pathname);

  const [dashboard, setDashboard] = useState<PlatformDashboardData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRead[]>([]);
  const [commandScopeOptions, setCommandScopeOptions] = useState<PlatformCommandScopeOption[]>([]);
  const [form, setForm] = useState<PlatformKeyForm>(INITIAL_FORM);
  const [latestRawKey, setLatestRawKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getPlatformDashboard()
      .then((nextDashboard) => {
        if (cancelled) return;
        setDashboard(nextDashboard);
        setApiKeys(nextDashboard.apiKeys);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load developer portal.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!dashboard || dashboard.authState !== "authenticated" || !form.machineIds.length) {
      setCommandScopeOptions([]);
      return () => {
        cancelled = true;
      };
    }

    listPlatformCommandScopeOptions(form.machineIds, dashboard.machineOptions)
      .then((options) => {
        if (!cancelled) {
          setCommandScopeOptions(options);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load command scopes.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dashboard, form.machineIds]);

  useEffect(() => {
    if (!commandScopeOptions.length && form.templateKeys.length) {
      setForm((current) => ({ ...current, templateKeys: [] }));
      return;
    }

    const allowedKeys = new Set(commandScopeOptions.map((item) => item.templateKey));
    const nextTemplateKeys = form.templateKeys.filter((key) => allowedKeys.has(key));

    if (nextTemplateKeys.length !== form.templateKeys.length) {
      setForm((current) => ({ ...current, templateKeys: nextTemplateKeys }));
    }
  }, [commandScopeOptions, form.templateKeys]);

  const stats = useMemo(() => buildPlatformApiKeyStats(apiKeys), [apiKeys]);

  const handleFieldChange = (
    field: "name" | "permission" | "expiryPreset" | "password",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]:
        field === "permission"
          ? (value as ApiKeyPermission)
          : field === "expiryPreset"
            ? (value as ApiKeyExpiryPreset)
            : value,
    }));
  };

  const handleToggleMachine = (machineId: string) => {
    setForm((current) => ({
      ...current,
      machineIds: current.machineIds.includes(machineId)
        ? current.machineIds.filter((id) => id !== machineId)
        : [...current.machineIds, machineId],
    }));
  };

  const handleToggleTemplate = (templateKey: string) => {
    setForm((current) => ({
      ...current,
      templateKeys: current.templateKeys.includes(templateKey)
        ? current.templateKeys.filter((key) => key !== templateKey)
        : [...current.templateKeys, templateKey],
    }));
  };

  const handleCreate = async () => {
    if (dashboard?.authState !== "authenticated") {
      return;
    }

    setNotice(null);
    setError(null);
    setLatestRawKey(null);

    if (!form.name.trim()) {
      setError("Enter a key name.");
      return;
    }

    if (!form.machineIds.length) {
      setError("Select at least one machine scope.");
      return;
    }

    if (!form.password.trim()) {
      setError("Confirm the action with your account password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createPlatformApiKey({
        name: form.name,
        permission: form.permission,
        machineIds: form.machineIds,
        allowedTemplateKeys: form.templateKeys,
        expiryPreset: form.expiryPreset,
        password: form.password,
      });
      setApiKeys((current) => [response.key, ...current]);
      setLatestRawKey(response.rawKey);
      setNotice("API key issued. Copy the raw key now; it will not be shown again.");
      setForm(INITIAL_FORM);
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.body : "Failed to issue the API key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!form.password.trim()) {
      setError("Enter your account password before revoking a key.");
      return;
    }

    setNotice(null);
    setError(null);
    setIsRevoking(true);
    try {
      await revokePlatformApiKey(keyId, form.password);
      setApiKeys((current) =>
        current.map((item) =>
          item.id === keyId
            ? { ...item, isActive: false, revokedAt: new Date().toISOString() }
            : item,
        ),
      );
      setNotice("API key revoked.");
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.body : "Failed to revoke the API key.");
    } finally {
      setIsRevoking(false);
    }
  };

  const page = (() => {
    if (isLoading && !dashboard) {
      return <div className="platform-loading-state">Loading developer portal...</div>;
    }

    if (error && !dashboard) {
      return <div className="platform-loading-state platform-loading-state--error">{error}</div>;
    }

    if (!dashboard) {
      return null;
    }

    if (route.key === "keys") {
      return (
        <PlatformApiKeysPage
          authState={dashboard.authState}
          apiKeys={apiKeys}
          machineOptions={dashboard.machineOptions}
          commandScopeOptions={commandScopeOptions}
          form={form}
          latestRawKey={latestRawKey}
          notice={notice}
          error={error}
          isSubmitting={isSubmitting}
          isRevoking={isRevoking}
          onFieldChange={handleFieldChange}
          onToggleMachine={handleToggleMachine}
          onToggleTemplate={handleToggleTemplate}
          onCreate={handleCreate}
          onRevoke={handleRevoke}
        />
      );
    }

    if (route.key === "docs") {
      return <PlatformDocsPage apiBaseUrl={dashboard.externalApiBaseUrl} />;
    }

    if (route.key === "analytics") {
      return <PlatformAnalyticsPage authState={dashboard.authState} apiKeys={apiKeys} stats={stats} />;
    }

    return <PlatformOverviewPage dashboard={dashboard} stats={stats} />;
  })();

  return (
    <PlatformShell
      activeRoute={route.key}
      authState={dashboard?.authState ?? "guest"}
      profile={dashboard?.profile ?? null}
      generatedAt={dashboard?.generatedAt ?? null}
    >
      {page}
    </PlatformShell>
  );
}
