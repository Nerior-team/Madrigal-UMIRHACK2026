import { apiFetch } from "./http";
import { formatMoscowDateTime, normalizeMachineTitle } from "./ui";

export type DeletedMachineRetention =
  | "none"
  | "week"
  | "month"
  | "three_months"
  | "six_months"
  | "year"
  | "forever";

export type NotificationTopic = "tasks" | "warnings" | "reports" | "security";
export type NotificationLevel = "info" | "success" | "warning" | "error";
export type NotificationChannel = "site" | "telegram";
export type SessionKind = "web" | "desktop" | "cli";
export type TwoFactorMethod = "totp" | "telegram";
export type ApiKeyPermission = "read" | "run";
export type ApiKeyExpiryPreset =
  | "one_time"
  | "day"
  | "week"
  | "month"
  | "year"
  | "unlimited";

type BackendSessionKind = SessionKind;

type BackendMeResponse = {
  user: {
    id: string;
    email: string;
    is_active: boolean;
    email_verified: boolean;
  };
  session_id: string;
  session_kind: BackendSessionKind;
  two_factor_enabled: boolean;
  enabled_two_factor_methods: TwoFactorMethod[];
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_data_url?: string | null;
  deleted_machine_retention: DeletedMachineRetention;
};

type BackendProfileResponse = {
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_data_url?: string | null;
  deleted_machine_retention: DeletedMachineRetention;
};

type BackendTelegramProfile = {
  linked: boolean;
  telegram_user_id?: string | null;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  linked_at?: string | null;
  two_factor_enabled: boolean;
  bot_username: string;
};

type BackendSessionRead = {
  id: string;
  session_kind: SessionKind;
  issued_at: string;
  last_seen_at?: string | null;
  access_expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_current: boolean;
  can_be_revoked: boolean;
  revoke_restricted_until?: string | null;
};

type BackendNotificationRead = {
  id: string;
  topic: NotificationTopic;
  level: NotificationLevel;
  title: string;
  message: string;
  action_url?: string | null;
  machine_id?: string | null;
  task_id?: string | null;
  result_id?: string | null;
  site_read: boolean;
  telegram_enabled: boolean;
  telegram_status?: "pending" | "delivered" | "read" | null;
  created_at: string;
};

type BackendNotificationListResponse = {
  items: BackendNotificationRead[];
  unread_count: number;
};

type BackendNotificationPreferencesResponse = {
  items: Array<{
    topic: NotificationTopic;
    site_enabled: boolean;
    telegram_enabled: boolean;
  }>;
};

type BackendTelegramLinkStartResponse = {
  link_url: string;
  expires_at: string;
};

type BackendReauthResponse = {
  reauth_token: string;
  expires_at: string;
};

type BackendTotpSetupStartResponse = {
  secret: string;
  provisioning_uri: string;
  issuer: string;
};

type BackendApiKeyRead = {
  id: string;
  public_id: string;
  name: string;
  permission: ApiKeyPermission;
  machine_ids: string[];
  allowed_template_keys: string[];
  usage_limit?: number | null;
  uses_count: number;
  expires_at?: string | null;
  last_used_at?: string | null;
  last_used_ip?: string | null;
  created_at: string;
  revoked_at?: string | null;
  is_active: boolean;
};

type BackendApiKeyCreateResponse = {
  key: BackendApiKeyRead;
  raw_key: string;
};

type BackendMachineSummary = {
  id: string;
  display_name: string;
  hostname: string;
};

export type AccountProfileDetails = {
  userId: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  sessionId: string;
  sessionKind: SessionKind;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarDataUrl?: string | null;
  deletedMachineRetention: DeletedMachineRetention;
  twoFactorEnabled: boolean;
  enabledTwoFactorMethods: TwoFactorMethod[];
  telegram: {
    linked: boolean;
    username?: string | null;
    firstName?: string | null;
    linkedAt?: string | null;
    twoFactorEnabled: boolean;
    botUsername: string;
  };
};

export type AccountSession = {
  id: string;
  sessionKind: SessionKind;
  issuedAt: string;
  lastSeenAt?: string | null;
  accessExpiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent: boolean;
  canBeRevoked: boolean;
  revokeRestrictedUntil?: string | null;
};

export type AccountNotification = {
  id: string;
  topic: NotificationTopic;
  level: NotificationLevel;
  title: string;
  message: string;
  actionUrl?: string | null;
  machineId?: string | null;
  taskId?: string | null;
  resultId?: string | null;
  siteRead: boolean;
  telegramEnabled: boolean;
  telegramStatus?: "pending" | "delivered" | "read" | null;
  createdAt: string;
  createdAtLabel: string;
};

export type NotificationPreference = {
  topic: NotificationTopic;
  siteEnabled: boolean;
  telegramEnabled: boolean;
};

export type NotificationPreferenceMap = Record<NotificationTopic, NotificationPreference>;

export type TelegramLinkStart = {
  linkUrl: string;
  expiresAt: string;
};

export type ReauthGrant = {
  token: string;
  expiresAt: string;
};

export type TotpSetupStart = {
  secret: string;
  provisioningUri: string;
  issuer: string;
};

export type ApiKeyRead = {
  id: string;
  publicId: string;
  name: string;
  permission: ApiKeyPermission;
  machineIds: string[];
  allowedTemplateKeys: string[];
  usageLimit?: number | null;
  usesCount: number;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  createdAt: string;
  revokedAt?: string | null;
  isActive: boolean;
};

export type ApiKeyCreateResult = {
  key: ApiKeyRead;
  rawKey: string;
};

export type AccountMachineScopeOption = {
  id: string;
  title: string;
};

function mapNotificationPreferenceMap(
  response: BackendNotificationPreferencesResponse,
): NotificationPreferenceMap {
  return response.items.reduce<NotificationPreferenceMap>(
    (accumulator, item) => {
      accumulator[item.topic] = {
        topic: item.topic,
        siteEnabled: item.site_enabled,
        telegramEnabled: item.telegram_enabled,
      };
      return accumulator;
    },
    {
      tasks: { topic: "tasks", siteEnabled: true, telegramEnabled: false },
      warnings: { topic: "warnings", siteEnabled: true, telegramEnabled: true },
      reports: { topic: "reports", siteEnabled: true, telegramEnabled: false },
      security: { topic: "security", siteEnabled: true, telegramEnabled: true },
    },
  );
}

function mapApiKey(key: BackendApiKeyRead): ApiKeyRead {
  return {
    id: key.id,
    publicId: key.public_id,
    name: key.name,
    permission: key.permission,
    machineIds: key.machine_ids,
    allowedTemplateKeys: key.allowed_template_keys,
    usageLimit: key.usage_limit,
    usesCount: key.uses_count,
    expiresAt: key.expires_at ?? null,
    lastUsedAt: key.last_used_at ?? null,
    lastUsedIp: key.last_used_ip ?? null,
    createdAt: key.created_at,
    revokedAt: key.revoked_at ?? null,
    isActive: key.is_active,
  };
}

export const accountApi = {
  async getProfileDetails(): Promise<AccountProfileDetails> {
    const [me, profile, telegram] = await Promise.all([
      apiFetch<BackendMeResponse>("/auth/me"),
      apiFetch<BackendProfileResponse>("/profile"),
      apiFetch<BackendTelegramProfile>("/profile/telegram"),
    ]);

    return {
      userId: me.user.id,
      email: me.user.email,
      isActive: me.user.is_active,
      emailVerified: me.user.email_verified,
      sessionId: me.session_id,
      sessionKind: me.session_kind,
      firstName: profile.first_name || me.first_name,
      lastName: profile.last_name || me.last_name,
      fullName: profile.full_name || me.full_name,
      avatarDataUrl: profile.avatar_data_url ?? me.avatar_data_url ?? null,
      deletedMachineRetention: profile.deleted_machine_retention ?? me.deleted_machine_retention,
      twoFactorEnabled: me.two_factor_enabled,
      enabledTwoFactorMethods: me.enabled_two_factor_methods,
      telegram: {
        linked: telegram.linked,
        username: telegram.telegram_username ?? null,
        firstName: telegram.telegram_first_name ?? null,
        linkedAt: telegram.linked_at ?? null,
        twoFactorEnabled: telegram.two_factor_enabled,
        botUsername: telegram.bot_username,
      },
    };
  },

  updateProfile(input: {
    firstName: string;
    lastName: string;
    avatarDataUrl?: string | null;
    deletedMachineRetention: DeletedMachineRetention;
  }): Promise<AccountProfileDetails> {
    return apiFetch<BackendProfileResponse>("/profile", {
      method: "PATCH",
      body: JSON.stringify({
        first_name: input.firstName,
        last_name: input.lastName,
        avatar_data_url: input.avatarDataUrl ?? null,
        deleted_machine_retention: input.deletedMachineRetention,
      }),
    }).then(async () => this.getProfileDetails());
  },

  changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/password/change", {
      method: "POST",
      body: JSON.stringify({
        current_password: input.currentPassword,
        new_password: input.newPassword,
        confirm_password: input.confirmPassword,
      }),
    });
  },

  listSessions(): Promise<AccountSession[]> {
    return apiFetch<BackendSessionRead[]>("/auth/sessions").then((sessions) =>
      sessions.map((session) => ({
        id: session.id,
        sessionKind: session.session_kind,
        issuedAt: session.issued_at,
        lastSeenAt: session.last_seen_at ?? null,
        accessExpiresAt: session.access_expires_at,
        ipAddress: session.ip_address ?? null,
        userAgent: session.user_agent ?? null,
        isCurrent: session.is_current,
        canBeRevoked: session.can_be_revoked,
        revokeRestrictedUntil: session.revoke_restricted_until ?? null,
      })),
    );
  },

  revokeSession(sessionId: string): Promise<{ message: string; revokedCurrentSession: boolean }> {
    return apiFetch<{ message: string; revoked_current_session: boolean }>(
      `/auth/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    ).then((response) => ({
      message: response.message,
      revokedCurrentSession: response.revoked_current_session,
    }));
  },

  listNotifications(): Promise<{ items: AccountNotification[]; unreadCount: number }> {
    return apiFetch<BackendNotificationListResponse>("/notifications").then((response) => ({
      items: response.items.map((item) => ({
        id: item.id,
        topic: item.topic,
        level: item.level,
        title: item.title,
        message: item.message,
        actionUrl: item.action_url ?? null,
        machineId: item.machine_id ?? null,
        taskId: item.task_id ?? null,
        resultId: item.result_id ?? null,
        siteRead: item.site_read,
        telegramEnabled: item.telegram_enabled,
        telegramStatus: item.telegram_status ?? null,
        createdAt: item.created_at,
        createdAtLabel: formatMoscowDateTime(item.created_at),
      })),
      unreadCount: response.unread_count,
    }));
  },

  markNotificationRead(notificationId: string): Promise<void> {
    return apiFetch<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "POST",
    });
  },

  markAllNotificationsRead(): Promise<void> {
    return apiFetch<void>("/notifications/read-all", {
      method: "POST",
    });
  },

  getNotificationPreferences(): Promise<NotificationPreferenceMap> {
    return apiFetch<BackendNotificationPreferencesResponse>("/notifications/preferences").then(
      mapNotificationPreferenceMap,
    );
  },

  updateNotificationPreferences(
    preferences: NotificationPreferenceMap,
  ): Promise<NotificationPreferenceMap> {
    return apiFetch<BackendNotificationPreferencesResponse>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify({
        items: Object.values(preferences).map((item) => ({
          topic: item.topic,
          site_enabled: item.siteEnabled,
          telegram_enabled: item.telegramEnabled,
        })),
      }),
    }).then(mapNotificationPreferenceMap);
  },

  reauth(input: { password?: string; totpCode?: string }): Promise<ReauthGrant> {
    return apiFetch<BackendReauthResponse>("/auth/re-auth", {
      method: "POST",
      body: JSON.stringify({
        password: input.password ?? null,
        totp_code: input.totpCode ?? null,
      }),
    }).then((response) => ({
      token: response.reauth_token,
      expiresAt: response.expires_at,
    }));
  },

  startTotpSetup(password: string): Promise<TotpSetupStart> {
    return apiFetch<BackendTotpSetupStartResponse>("/auth/2fa/totp/setup/start", {
      method: "POST",
      body: JSON.stringify({ password }),
    }).then((response) => ({
      secret: response.secret,
      provisioningUri: response.provisioning_uri,
      issuer: response.issuer,
    }));
  },

  confirmTotpSetup(code: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/2fa/totp/setup/confirm", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  disableTotp(input: { password: string; code: string }): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/2fa/totp/disable", {
      method: "POST",
      body: JSON.stringify({
        password: input.password,
        code: input.code,
      }),
    });
  },

  startTelegramLink(): Promise<TelegramLinkStart> {
    return apiFetch<BackendTelegramLinkStartResponse>("/profile/telegram/link", {
      method: "POST",
    }).then((response) => ({
      linkUrl: response.link_url,
      expiresAt: response.expires_at,
    }));
  },

  unlinkTelegram(reauthToken: string): Promise<void> {
    return apiFetch<void>("/profile/telegram", {
      method: "DELETE",
      body: JSON.stringify({ reauth_token: reauthToken }),
    });
  },

  startTelegramTwoFactorSetup(): Promise<{
    supported: boolean;
    linked: boolean;
    enabled: boolean;
    reason?: string | null;
    linkUrl?: string | null;
    expiresAt?: string | null;
  }> {
    return apiFetch<{
      supported: boolean;
      linked: boolean;
      enabled: boolean;
      reason?: string | null;
      link_url?: string | null;
      expires_at?: string | null;
    }>("/auth/2fa/telegram/setup/start", {
      method: "POST",
    }).then((response) => ({
      supported: response.supported,
      linked: response.linked,
      enabled: response.enabled,
      reason: response.reason ?? null,
      linkUrl: response.link_url ?? null,
      expiresAt: response.expires_at ?? null,
    }));
  },

  confirmTelegramTwoFactorSetup(reauthToken: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/2fa/telegram/setup/confirm", {
      method: "POST",
      body: JSON.stringify({ reauth_token: reauthToken }),
    });
  },

  disableTelegramTwoFactor(reauthToken: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/2fa/telegram/disable", {
      method: "POST",
      body: JSON.stringify({ reauth_token: reauthToken }),
    });
  },

  listApiKeys(): Promise<ApiKeyRead[]> {
    return apiFetch<BackendApiKeyRead[]>("/profile/api-keys").then((items) =>
      items.map(mapApiKey),
    );
  },

  createApiKey(input: {
    name: string;
    permission: ApiKeyPermission;
    machineIds: string[];
    allowedTemplateKeys: string[];
    expiryPreset: ApiKeyExpiryPreset;
    reauthToken: string;
  }): Promise<ApiKeyCreateResult> {
    return apiFetch<BackendApiKeyCreateResponse>("/profile/api-keys", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        permission: input.permission,
        machine_ids: input.machineIds,
        allowed_template_keys: input.allowedTemplateKeys,
        expiry_preset: input.expiryPreset,
        reauth_token: input.reauthToken,
      }),
    }).then((response) => ({
      key: mapApiKey(response.key),
      rawKey: response.raw_key,
    }));
  },

  revokeApiKey(keyId: string, reauthToken: string): Promise<void> {
    return apiFetch<void>(`/profile/api-keys/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
      body: JSON.stringify({ reauth_token: reauthToken }),
    });
  },

  listMachineScopeOptions(): Promise<AccountMachineScopeOption[]> {
    return apiFetch<BackendMachineSummary[]>("/machines").then((machines) =>
      machines.map((machine) => ({
        id: machine.id,
        title: normalizeMachineTitle(machine.display_name || machine.hostname),
      })),
    );
  },
};
