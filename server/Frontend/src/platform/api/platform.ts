import {
  accountApi,
  api,
  type AccountMachineScopeOption,
  type AccountProfileDetails,
  type ApiKeyCreateResult,
  type ApiKeyExpiryPreset,
  type ApiKeyPermission,
  type ApiKeyRead,
} from "../../core";
import { PLATFORM_ENDPOINTS } from "../docs/reference";

export type PlatformDashboardData = {
  profile: AccountProfileDetails;
  apiKeys: ApiKeyRead[];
  machineOptions: AccountMachineScopeOption[];
  externalApiBaseUrl: string;
  endpointCount: number;
  generatedAt: string;
};

export type PlatformCommandScopeOption = {
  templateKey: string;
  name: string;
  description?: string | null;
  machineIds: string[];
  machineTitles: string[];
  runner: string;
};

export type PlatformApiKeyStats = {
  total: number;
  active: number;
  runEnabled: number;
  totalUses: number;
  expiring: number;
  mostUsed: ApiKeyRead[];
  mostRecent: ApiKeyRead[];
};

export function resolveExternalApiBaseUrl(origin?: string): string {
  const normalizedOrigin =
    (origin ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  return normalizedOrigin ? `${normalizedOrigin}/api/v1/external` : "/api/v1/external";
}

export async function getPlatformDashboard(origin?: string): Promise<PlatformDashboardData> {
  const [profile, apiKeys, machineOptions] = await Promise.all([
    accountApi.getProfileDetails(),
    accountApi.listApiKeys(),
    accountApi.listMachineScopeOptions(),
  ]);

  return {
    profile,
    apiKeys,
    machineOptions,
    externalApiBaseUrl: resolveExternalApiBaseUrl(origin),
    endpointCount: PLATFORM_ENDPOINTS.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function listPlatformCommandScopeOptions(
  machineIds: string[],
  machineOptions: AccountMachineScopeOption[],
): Promise<PlatformCommandScopeOption[]> {
  const uniqueMachineIds = Array.from(new Set(machineIds.filter(Boolean)));
  if (!uniqueMachineIds.length) {
    return [];
  }

  const machineNameMap = new Map(machineOptions.map((machine) => [machine.id, machine.title]));
  const templatesByMachine = await Promise.all(
    uniqueMachineIds.map(async (machineId) => ({
      machineId,
      templates: await api.getMachineCommandTemplates(machineId),
    })),
  );

  const scopeMap = new Map<string, PlatformCommandScopeOption>();
  for (const entry of templatesByMachine) {
    for (const template of entry.templates.filter((item) => item.isEnabled)) {
      const existing = scopeMap.get(template.templateKey);
      const machineTitle = machineNameMap.get(entry.machineId) ?? entry.machineId;

      if (!existing) {
        scopeMap.set(template.templateKey, {
          templateKey: template.templateKey,
          name: template.name,
          description: template.description,
          machineIds: [entry.machineId],
          machineTitles: [machineTitle],
          runner: template.runner,
        });
        continue;
      }

      if (!existing.machineIds.includes(entry.machineId)) {
        existing.machineIds.push(entry.machineId);
      }
      if (!existing.machineTitles.includes(machineTitle)) {
        existing.machineTitles.push(machineTitle);
      }
    }
  }

  return [...scopeMap.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export async function createPlatformApiKey(input: {
  name: string;
  permission: ApiKeyPermission;
  machineIds: string[];
  allowedTemplateKeys: string[];
  expiryPreset: ApiKeyExpiryPreset;
  password: string;
}): Promise<ApiKeyCreateResult> {
  const grant = await accountApi.reauth({ password: input.password.trim() });
  return accountApi.createApiKey({
    name: input.name.trim(),
    permission: input.permission,
    machineIds: input.machineIds,
    allowedTemplateKeys: input.allowedTemplateKeys,
    expiryPreset: input.expiryPreset,
    reauthToken: grant.token,
  });
}

export async function revokePlatformApiKey(keyId: string, password: string): Promise<void> {
  const grant = await accountApi.reauth({ password: password.trim() });
  await accountApi.revokeApiKey(keyId, grant.token);
}

export function buildPlatformApiKeyStats(apiKeys: ApiKeyRead[]): PlatformApiKeyStats {
  const active = apiKeys.filter((item) => item.isActive);
  const runEnabled = apiKeys.filter((item) => item.permission === "run");
  const expiring = apiKeys.filter((item) => item.expiresAt).length;
  const totalUses = apiKeys.reduce((sum, item) => sum + item.usesCount, 0);
  const mostUsed = [...apiKeys]
    .sort((left, right) => right.usesCount - left.usesCount)
    .slice(0, 5);
  const mostRecent = [...apiKeys]
    .filter((item) => item.lastUsedAt)
    .sort((left, right) => {
      const leftTime = left.lastUsedAt ? new Date(left.lastUsedAt).getTime() : 0;
      const rightTime = right.lastUsedAt ? new Date(right.lastUsedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 5);

  return {
    total: apiKeys.length,
    active: active.length,
    runEnabled: runEnabled.length,
    totalUses,
    expiring,
    mostUsed,
    mostRecent,
  };
}
