import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { PlatformOverviewPage } from "./pages/PlatformOverviewPage";
import { resolvePlatformRoute } from "./routes";
import { usePlatformSession } from "./session";

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
  const navigate = useNavigate();
  const route = resolvePlatformRoute(location.pathname);
  const { setGuest, signOut } = usePlatformSession();

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
        if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
          setGuest();
          navigate("/login", { replace: true });
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c API-\u043a\u0430\u0431\u0438\u043d\u0435\u0442.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, setGuest]);

  useEffect(() => {
    let cancelled = false;

    if (!dashboard || !form.machineIds.length) {
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
          setError(loadError instanceof Error ? loadError.message : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c scope \u043a\u043e\u043c\u0430\u043d\u0434.");
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
    setNotice(null);
    setError(null);
    setLatestRawKey(null);

    if (!form.name.trim()) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043b\u044e\u0447\u0430.");
      return;
    }

    if (!form.machineIds.length) {
      setError("\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u043d\u0443 \u043c\u0430\u0448\u0438\u043d\u0443 \u0434\u043b\u044f scope.");
      return;
    }

    if (!form.password.trim()) {
      setError("\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043f\u0430\u0440\u043e\u043b\u0435\u043c \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430.");
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
      setNotice("API-\u043a\u043b\u044e\u0447 \u0432\u044b\u043f\u0443\u0449\u0435\u043d. \u0421\u043a\u043e\u043f\u0438\u0440\u0443\u0439\u0442\u0435 raw key \u0441\u0435\u0439\u0447\u0430\u0441: \u043e\u043d \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435 \u0431\u0443\u0434\u0435\u0442 \u043f\u043e\u043a\u0430\u0437\u0430\u043d.");
      setForm(INITIAL_FORM);
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.body : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u043f\u0443\u0441\u0442\u0438\u0442\u044c API-\u043a\u043b\u044e\u0447.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!form.password.trim()) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 \u043f\u0435\u0440\u0435\u0434 \u043e\u0442\u0437\u044b\u0432\u043e\u043c \u043a\u043b\u044e\u0447\u0430.");
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
      setNotice("API-\u043a\u043b\u044e\u0447 \u043e\u0442\u043e\u0437\u0432\u0430\u043d.");
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.body : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043e\u0437\u0432\u0430\u0442\u044c API-\u043a\u043b\u044e\u0447.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (isLoading && !dashboard) {
    return <div className="platform-loading-state">{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 API-\u043a\u0430\u0431\u0438\u043d\u0435\u0442\u0430..."}</div>;
  }

  if (error && !dashboard) {
    return <div className="platform-loading-state platform-loading-state--error">{error}</div>;
  }

  if (!dashboard) {
    return null;
  }

  const page =
    route.key === "keys" ? (
      <PlatformApiKeysPage
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
    ) : route.key === "analytics" ? (
      <PlatformAnalyticsPage apiKeys={apiKeys} stats={stats} />
    ) : (
      <PlatformOverviewPage dashboard={dashboard} stats={stats} />
    );

  return (
    <PlatformShell
      activeRoute={route.key}
      profile={dashboard.profile}
      generatedAt={dashboard.generatedAt}
      onSignOut={handleSignOut}
    >
      {page}
    </PlatformShell>
  );
}
