import {
  formatMoscowDateTime,
  normalizeMachineOsLabel,
  normalizeMachineTitle,
} from "./ui";
import { formatLogStreamLine } from "./logs";
import { apiFetch } from "./http";
import { getTaskPresentation, type BackendTaskLifecycle } from "./operations";
import {
  buildAccessMetrics,
  getAccessRowCapabilities,
  getAssignableRoles,
  getInviteStatusPresentation,
  sortAccessEntries,
  type AccessActorRole,
  type AccessEntryLike,
  type InviteLike,
} from "./access";

export interface AuthResponse {
  token?: string;
  requiresConfirmation?: boolean;
  challengeId?: string;
}

export interface HomeDashboardResponse {
  metrics: Array<{
    id: string;
    title: string;
    value: string;
    detailValue?: string;
    detailText?: string;
    trendIconSrc?: string;
    iconSrc: string;
    accent: "blue" | "green" | "yellow" | "red";
    progress?: number;
    progressLeft?: string;
    progressRight?: string;
  }>;
  actions: Array<{
    label: string;
    iconSrc: string;
  }>;
  errors: Array<{
    title: string;
    createdAt: string;
    stoppedAt: string;
    ago: string;
  }>;
  tasks: Array<{
    id: string;
    machine: string;
    status: string;
    createdAt: string;
    sender: string;
  }>;
}

export interface MachineCardResponse {
  id: string;
  machine: string;
  hostname: string;
  os: string;
  heartbeat: string;
  owner: string;
  myRole: string;
  initials?: string;
  status: "online" | "running" | "offline";
  badgeTone: "violet" | "cyan" | "green";
}

export interface TaskCardResponse {
  id: string;
  machineId: string;
  machine: string;
  templateKey: string;
  resultId?: string;
  renderedCommand: string;
  requestedBy: string;
  taskNumber: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  serverNumber: string;
  resultText: string;
  resultColor: "green" | "yellow" | "red" | "gray";
  statusLabel: string;
  status: "queued" | "completed" | "in_progress" | "error";
}

export interface AccessDashboardResponse {
  metrics: Array<{
    id: string;
    title: string;
    value: string;
    tone?: "default" | "highlight";
  }>;
  machines: Array<{
    id: string;
    resource: string;
    role: string;
    roleValue: "viewer" | "admin" | "operator" | "owner";
    canInvite: boolean;
    availableRoleValues: Array<"viewer" | "admin" | "operator">;
  }>;
  users: Array<{
    id: string;
    accessId: string;
    machineId: string;
    email: string;
    role: string;
    roleValue: "viewer" | "admin" | "operator" | "owner";
    roleTone: "viewer" | "admin" | "operator" | "owner";
    resource: string;
    status: string;
    statusTone: "active" | "pending";
    action: string;
    canManage: boolean;
    canRevoke: boolean;
    isCreatorOwner: boolean;
    availableRoleValues: Array<"viewer" | "admin" | "operator">;
  }>;
  invites: Array<{
    id: string;
    inviteId: string;
    machineId: string;
    email: string;
    role: string;
    roleValue: "viewer" | "admin" | "operator" | "owner";
    resource: string;
    status: string;
    statusTone: "active" | "pending" | "muted";
    createdAt: string;
    expiresAt: string;
  }>;
  activity: Array<{
    id: string;
    actor: string;
    email: string;
    role: string;
    time: string;
    actionText: string;
  }>;
}

export interface LogsDashboardResponse {
  entries: Array<{
    id: string;
    taskId: string;
    machineId: string;
    taskTitle: string;
    renderedCommand: string;
    machine: string;
    action: string;
    email: string;
    status: string;
    tone: "success" | "warning" | "critical";
    createdAt: string;
  }>;
  streamItems: Array<{
    id: string;
    taskId: string;
    machineId: string;
    kind: "request" | "response";
    machine: string;
    title: string;
    text: string;
    createdAt: string;
    createdAtIso: string;
  }>;
  streamLines: string[];
}

export interface ReportsDashboardResponse {
  tasks: Array<{
    id: string;
    machineId: string;
    machine: string;
    machineStatus: MachineCardResponse["status"];
    templateName: string;
    requestedBy: string;
    status: TaskCardResponse["status"];
    createdAtIso: string;
    durationMs?: number;
  }>;
}

export interface ResultsDashboardResponse {
  rows: Array<{
    id: string;
    taskId: string;
    machineId: string;
    title: string;
    statusLabel: string;
    statusTone: "success" | "error" | "cancelled" | "pending";
    machine: string;
    command: string;
    resultAt: string;
    resultAtIso: string;
  }>;
}

export interface TaskDetailResponse {
  id: string;
  machineId: string;
  machine: string;
  title: string;
  templateKey: string;
  renderedCommand: string;
  requestedBy: string;
  status: TaskCardResponse["status"];
  statusLabel: string;
  resultText: string;
  startedAt: string;
  completedAt?: string;
}

export interface TaskLogLineResponse {
  id: string;
  attemptId: string;
  stream: "stdout" | "stderr" | "system";
  sequence: number;
  text: string;
  createdAt: string;
  createdAtIso: string;
}

export interface ResultDetailResponse {
  id: string;
  taskId: string;
  parserKind: string;
  summary?: string | null;
  parsedPayload?: Record<string, unknown> | null;
  createdAt: string;
  shell: {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
  };
}

export interface ProfileDashboardResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  emailVerified: boolean;
  sessionKind: "web" | "desktop" | "cli";
  twoFactorEnabled: boolean;
  enabledTwoFactorMethods: string[];
}

export interface CommandTemplateParameter {
  key: string;
  label: string;
  allowedValues: string[];
}

export interface CommandTemplateOption {
  id?: string | null;
  templateKey: string;
  name: string;
  description?: string | null;
  runner: string;
  commandPattern: string;
  parameters: CommandTemplateParameter[];
  parserKind: string;
}

type BackendSessionKind = "web" | "desktop" | "cli";

type BackendAuthSessionResponse = {
  requires_two_factor?: boolean;
  challenge_id?: string | null;
  tokens?: {
    access_token: string;
  } | null;
};

type BackendMeResponse = {
  user: {
    id: string;
    email: string;
    is_active: boolean;
    email_verified: boolean;
  };
  session_kind: BackendSessionKind;
  two_factor_enabled: boolean;
  enabled_two_factor_methods: string[];
};

type BackendReauthResponse = {
  reauth_token: string;
  expires_at: string;
};

type BackendMachineStatus = "pending" | "online" | "offline";
type BackendMachineRole = "owner" | "admin" | "operator" | "viewer";

type BackendMachineSummary = {
  id: string;
  display_name: string;
  hostname: string;
  os_family: string;
  os_version?: string | null;
  status: BackendMachineStatus;
  last_heartbeat_at?: string | null;
  owner_email: string;
  my_role: BackendMachineRole;
};

type BackendMachineDetail = BackendMachineSummary & {
  creator_user_id: string;
};

type BackendCommandTemplateRead = {
  id?: string | null;
  template_key: string;
  name: string;
  description?: string | null;
  runner: string;
  command_pattern: string;
  parameters: Array<{
    key: string;
    label: string;
    allowed_values: string[];
  }>;
  parser_kind: string;
};

type BackendTaskAttempt = {
  id: string;
  status: BackendTaskLifecycle;
  queued_at?: string;
  dispatched_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  cancel_requested_at?: string | null;
  result_id?: string | null;
};

type BackendTaskRead = {
  id: string;
  machine_id: string;
  template_key: string;
  template_name: string;
  rendered_command?: string | null;
  status: BackendTaskLifecycle;
  requested_by_user_id: string;
  created_at: string;
  attempts: BackendTaskAttempt[];
};

type BackendResultHistoryEntryRead = {
  id: string;
  task_id: string;
  attempt_id: string;
  machine_id: string;
  template_key: string;
  template_name: string;
  parser_kind: string;
  summary?: string | null;
  exit_code: number;
  duration_ms: number;
  created_at: string;
};

type BackendResultRead = {
  id: string;
  task_id: string;
  attempt_id: string;
  parser_kind: string;
  summary?: string | null;
  parsed_payload?: Record<string, unknown> | null;
  shell: {
    command: string;
    stdout: string;
    stderr: string;
    exit_code: number;
    duration_ms: number;
  };
  created_at: string;
};

type BackendTaskLogStream = "stdout" | "stderr" | "system";

type BackendTaskLogEntry = {
  id: string;
  attempt_id: string;
  stream: BackendTaskLogStream;
  sequence: number;
  chunk: string;
  created_at: string;
};

type BackendMachineAccessEntry = {
  id: string;
  user_id: string;
  email: string;
  role: BackendMachineRole;
  granted_by_user_id?: string | null;
  created_at: string;
  revoked_at?: string | null;
  is_creator_owner: boolean;
};

type BackendMachineInviteStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "invalidated";

type BackendMachineInviteRead = {
  id: string;
  email: string;
  role: BackendMachineRole;
  status: BackendMachineInviteStatus;
  created_at: string;
  expires_at: string;
  invited_by_user_id: string;
};

type AssignableAccessRole = "viewer" | "admin" | "operator";

const AUTH_CLIENT_KIND: BackendSessionKind = "web";

function clearPersistedAuthToken(): void {
  // Cookie sessions are owned by the backend and cleared through /auth/logout.
}

function hasPersistedAuthToken(): boolean {
  return true;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "Нет данных";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatResultDateTime(value?: string | null): string {
  if (!value) return "Нет данных";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timePart = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isToday) {
    return `Сегодня, ${timePart}`;
  }

  const datePart = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return `${datePart}, ${timePart}`;
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function mapMachineStatus(
  status: BackendMachineStatus,
): MachineCardResponse["status"] {
  if (status === "online") return "online";
  if (status === "pending") return "running";
  return "offline";
}

function mapMachineBadgeTone(
  role: BackendMachineRole,
): MachineCardResponse["badgeTone"] {
  if (role === "owner") return "violet";
  if (role === "admin") return "cyan";
  if (role === "operator") return "green";
  return "violet";
}

function mapMachineSummary(
  machine: BackendMachineSummary,
): MachineCardResponse {
  return {
    id: machine.id,
    machine: normalizeMachineTitle(machine.display_name || machine.hostname),
    hostname: machine.hostname,
    os: normalizeMachineOsLabel(
      machine.os_version
        ? `${machine.os_family} ${machine.os_version}`
        : machine.os_family,
    ),
    heartbeat: formatMoscowDateTime(machine.last_heartbeat_at),
    owner: machine.owner_email,
    myRole: mapAccessRoleLabel(machine.my_role),
    status: mapMachineStatus(machine.status),
    badgeTone: mapMachineBadgeTone(machine.my_role),
  };
}

function mapPresentationToResultColor(
  tone: ReturnType<typeof getTaskPresentation>["resultTone"],
): TaskCardResponse["resultColor"] {
  if (tone === "success") return "green";
  if (tone === "warning") return "yellow";
  if (tone === "danger") return "red";
  return "gray";
}

function mapTask(
  task: BackendTaskRead,
  machineMap: Map<string, BackendMachineSummary>,
  userEmailMap: Map<string, string>,
): TaskCardResponse {
  const presentation = getTaskPresentation(task.status);
  const lastAttempt = task.attempts[task.attempts.length - 1];

  const machineDigits = extractDigits(task.machine_id);
  const serverNumber = machineDigits || task.machine_id.slice(0, 6);
  const taskDigits = extractDigits(task.id);
  const taskNumber = taskDigits || task.id.slice(0, 6);

  const machine = machineMap.get(task.machine_id);
  const taskTitle = machine ? `${task.template_name}` : task.template_name;

  const startedAt = formatDateTime(
    lastAttempt?.started_at ?? lastAttempt?.queued_at ?? task.created_at,
  );
  const completedAt =
    presentation.group === "in_progress" || presentation.group === "queued"
      ? undefined
      : formatDateTime(lastAttempt?.finished_at ?? task.created_at);

  return {
    id: task.id,
    machineId: task.machine_id,
    machine: normalizeMachineTitle(
      machine?.display_name || machine?.hostname || task.machine_id,
    ),
    resultId: lastAttempt?.result_id ?? undefined,
    templateKey: task.template_key,
    renderedCommand: getTaskRenderedCommand(task),
    requestedBy:
      userEmailMap.get(task.requested_by_user_id) ?? task.requested_by_user_id,
    taskNumber,
    title: taskTitle,
    startedAt,
    completedAt,
    serverNumber,
    resultText: presentation.resultLabel,
    resultColor: mapPresentationToResultColor(presentation.resultTone),
    statusLabel: presentation.taskStatusLabel,
    status: presentation.group,
  };
}

function mapAccessRoleLabel(role: BackendMachineRole): string {
  if (role === "owner") return "Владелец";
  if (role === "admin") return "Администратор";
  if (role === "operator") return "Оператор";
  return "Наблюдатель";
}

function mapAccessRoleTone(
  role: BackendMachineRole,
): AccessDashboardResponse["users"][number]["roleTone"] {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  if (role === "operator") return "operator";
  return "viewer";
}

function mapAccessStatus(entry: BackendMachineAccessEntry): {
  status: string;
  statusTone: "active" | "pending";
} {
  if (entry.revoked_at) {
    return { status: "Отозван", statusTone: "pending" };
  }

  return { status: "Активен", statusTone: "active" };
}

function getMachineResource(machine: BackendMachineSummary): string {
  return normalizeMachineTitle(machine.display_name || machine.hostname);
}

function mapAssignableAccessRoles(
  actorRole: BackendMachineRole,
): AssignableAccessRole[] {
  return getAssignableRoles(actorRole as AccessActorRole).filter(
    (role): role is AssignableAccessRole => role !== "owner",
  );
}

function mapLogTone(
  status: BackendTaskLifecycle,
): LogsDashboardResponse["entries"][number]["tone"] {
  return getTaskPresentation(status).logTone;
}

function mapLogStatusLabel(status: BackendTaskLifecycle): string {
  return getTaskPresentation(status).taskStatusLabel;
}

function shortenText(text: string, maxLength = 96): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "Событие без описания";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function pickTaskEventDate(
  task: BackendTaskRead,
  logs: BackendTaskLogEntry[],
): string {
  const latestLog = logs[logs.length - 1]?.created_at;
  if (latestLog) return latestLog;

  const latestAttempt = task.attempts[task.attempts.length - 1];
  return (
    latestAttempt?.finished_at ??
    latestAttempt?.started_at ??
    latestAttempt?.queued_at ??
    task.created_at
  );
}

function pickTaskCreatedAtIso(task: BackendTaskRead): string {
  const latestAttempt = task.attempts[task.attempts.length - 1];
  return (
    latestAttempt?.started_at ?? latestAttempt?.queued_at ?? task.created_at
  );
}

function pickTaskDurationMs(task: BackendTaskRead): number | undefined {
  const latestAttempt = task.attempts[task.attempts.length - 1];
  if (!latestAttempt?.started_at || !latestAttempt?.finished_at) {
    return undefined;
  }

  const startedAt = new Date(latestAttempt.started_at).getTime();
  const finishedAt = new Date(latestAttempt.finished_at).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt)) {
    return undefined;
  }

  return Math.max(0, finishedAt - startedAt);
}

function deriveNameFromEmail(email: string): {
  firstName: string;
  lastName: string;
} {
  const localPart = email.split("@")[0] ?? "";
  const segments = localPart
    .split(/[._-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const capitalize = (value: string): string => {
    if (!value) return value;
    return `${value[0].toUpperCase()}${value.slice(1)}`;
  };

  if (segments.length >= 2) {
    return {
      firstName: capitalize(segments[0]),
      lastName: capitalize(segments[1]),
    };
  }

  if (segments.length === 1) {
    return {
      firstName: capitalize(segments[0]),
      lastName: "Фамилия",
    };
  }

  return {
    firstName: "Имя",
    lastName: "Фамилия",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, init);
}

async function loadMachineTasks(
  machineIds: string[],
): Promise<BackendTaskRead[]> {
  if (!machineIds.length) return [];

  const settled = await Promise.allSettled(
    machineIds.map((machineId) =>
      request<BackendTaskRead[]>(
        `/machines/${encodeURIComponent(machineId)}/tasks`,
      ),
    ),
  );

  const tasks = settled
    .filter(
      (result): result is PromiseFulfilledResult<BackendTaskRead[]> =>
        result.status === "fulfilled",
    )
    .flatMap((result) => result.value);

  return tasks.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function loadTaskLogs(
  taskIds: string[],
): Promise<Map<string, BackendTaskLogEntry[]>> {
  if (!taskIds.length) return new Map();

  const settled = await Promise.allSettled(
    taskIds.map((taskId) =>
      request<BackendTaskLogEntry[]>(
        `/tasks/${encodeURIComponent(taskId)}/logs`,
      ).then((logs) => [taskId, logs] as const),
    ),
  );

  const logsByTask = new Map<string, BackendTaskLogEntry[]>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;

    const [taskId, logs] = result.value;
    logsByTask.set(
      taskId,
      [...logs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    );
  }

  return logsByTask;
}

async function loadMachineResults(
  machineIds: string[],
): Promise<BackendResultHistoryEntryRead[]> {
  if (!machineIds.length) return [];

  const settled = await Promise.allSettled(
    machineIds.map((machineId) =>
      request<BackendResultHistoryEntryRead[]>(
        `/machines/${encodeURIComponent(machineId)}/results`,
      ),
    ),
  );

  const results = settled
    .filter(
      (result): result is PromiseFulfilledResult<BackendResultHistoryEntryRead[]> =>
        result.status === "fulfilled",
    )
    .flatMap((result) => result.value);

  return results.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function loadMachineInvites(
  machineIds: string[],
): Promise<Map<string, BackendMachineInviteRead[]>> {
  if (!machineIds.length) return new Map();

  const settled = await Promise.allSettled(
    machineIds.map((machineId) =>
      request<BackendMachineInviteRead[]>(
        `/machines/${encodeURIComponent(machineId)}/invites`,
      ).then((invites) => [machineId, invites] as const),
    ),
  );

  const invitesByMachine = new Map<string, BackendMachineInviteRead[]>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;

    const [machineId, invites] = result.value;
    invitesByMachine.set(machineId, invites);
  }

  return invitesByMachine;
}

function getTaskRenderedCommand(task: BackendTaskRead): string {
  return task.rendered_command?.trim() || task.template_name;
}

async function loadUserEmailMap(
  machineIds: string[],
): Promise<Map<string, string>> {
  if (!machineIds.length) return new Map();

  const settled = await Promise.allSettled(
    machineIds.map((machineId) =>
      request<BackendMachineAccessEntry[]>(
        `/machines/${encodeURIComponent(machineId)}/access`,
      ),
    ),
  );

  const emailMap = new Map<string, string>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;

    for (const entry of result.value) {
      if (!emailMap.has(entry.user_id)) {
        emailMap.set(entry.user_id, entry.email);
      }
    }
  }

  return emailMap;
}

async function buildAccessDashboard(): Promise<AccessDashboardResponse> {
  const [machines, me] = await Promise.all([
    request<BackendMachineSummary[]>("/machines"),
    request<BackendMeResponse>("/auth/me"),
  ]);
  const machineIds = machines.map((machine) => machine.id);
  const machineMap = new Map(machines.map((machine) => [machine.id, machine]));

  const [accessSettled, invitesByMachine] = await Promise.all([
    Promise.allSettled(
      machines.map((machine) =>
        request<BackendMachineAccessEntry[]>(
          `/machines/${encodeURIComponent(machine.id)}/access`,
        ).then((entries) => ({ machine, entries })),
      ),
    ),
    loadMachineInvites(machineIds),
  ]);

  const accessEntries = accessSettled
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        machine: BackendMachineSummary;
        entries: BackendMachineAccessEntry[];
      }> => result.status === "fulfilled",
    )
    .flatMap((result) =>
      result.value.entries.map((entry) => ({
        id: entry.id,
        machineId: result.value.machine.id,
        machineName: getMachineResource(result.value.machine),
        userId: entry.user_id,
        email: entry.email,
        role: entry.role as AccessActorRole,
        createdAt: entry.created_at,
        revokedAt: entry.revoked_at ?? null,
        isCreatorOwner: entry.is_creator_owner,
      })),
    );

  const inviteEntries = [...invitesByMachine.entries()].flatMap(
    ([machineId, machineInvites]) => {
      const machine = machineMap.get(machineId);
      if (!machine) return [];

      return machineInvites.map((invite) => ({
        id: invite.id,
        machineId,
        machineName: getMachineResource(machine),
        email: invite.email,
        role: invite.role as AccessActorRole,
        status: invite.status,
        expiresAt: invite.expires_at,
      })) satisfies InviteLike[];
    },
  );

  const knownUserEmails = new Map<string, string>([[me.user.id, me.user.email]]);
  const accessById = new Map<string, BackendMachineAccessEntry>();
  for (const result of accessSettled) {
    if (result.status !== "fulfilled") continue;

    for (const entry of result.value.entries) {
      knownUserEmails.set(entry.user_id, entry.email);
      accessById.set(entry.id, entry);
    }
  }

  const activeEntries = accessEntries.filter((entry) => !entry.revokedAt);
  const uniqueAdmins = new Set(
    activeEntries
      .filter((entry) => entry.role === "admin")
      .map((entry) => entry.userId),
  );
  const baseMetrics = buildAccessMetrics(accessEntries, inviteEntries);

  const users = sortAccessEntries(accessEntries).map((entry) => {
    const machine = machineMap.get(entry.machineId);
    const rawEntry = accessById.get(entry.id);
    if (!machine || !rawEntry) {
      throw new Error(`Access row ${entry.id} is missing machine context.`);
    }

    const capabilities = getAccessRowCapabilities({
      actorRole: machine.my_role as AccessActorRole,
      actorUserId: me.user.id,
      entry,
    });
    const status = mapAccessStatus(rawEntry);

    return {
      id: `${entry.machineId}_${entry.id}`,
      accessId: entry.id,
      machineId: entry.machineId,
      email: entry.email,
      role: mapAccessRoleLabel(entry.role),
      roleValue: entry.role,
      roleTone: mapAccessRoleTone(entry.role),
      resource: entry.machineName,
      status: status.status,
      statusTone: status.statusTone,
      action: capabilities.canManage ? "Управлять" : "-",
      canManage: capabilities.canManage,
      canRevoke: capabilities.canRevoke,
      isCreatorOwner: entry.isCreatorOwner,
      availableRoleValues: capabilities.assignableRoles.filter(
        (role): role is AssignableAccessRole => role !== "owner",
      ),
    };
  });

  const invites = [...invitesByMachine.entries()]
    .flatMap(([machineId, machineInvites]) => {
      const machine = machineMap.get(machineId);
      if (!machine) return [];

      return machineInvites.map((invite) => {
        const presentation = getInviteStatusPresentation(invite.status);
        return {
          id: `${machineId}_${invite.id}`,
          inviteId: invite.id,
          machineId,
          email: invite.email,
          role: mapAccessRoleLabel(invite.role),
          roleValue: invite.role,
          resource: getMachineResource(machine),
          status: presentation.label,
          statusTone: presentation.tone,
          createdAt: formatDateTime(invite.created_at),
          expiresAt: formatDateTime(invite.expires_at),
          createdAtIso: invite.created_at,
        };
      });
    })
    .sort(
      (left, right) =>
        new Date(right.createdAtIso).getTime() -
        new Date(left.createdAtIso).getTime(),
    )
    .map(({ createdAtIso: _createdAtIso, ...invite }) => invite);

  const activity = [
    ...accessEntries.map((entry) => {
      const rawEntry = accessById.get(entry.id);
      const grantedByUserId = rawEntry?.granted_by_user_id ?? null;
      return {
        id: `access_${entry.machineId}_${entry.id}`,
        actor: grantedByUserId
          ? knownUserEmails.get(grantedByUserId) ?? "Система"
          : "Система",
        email: entry.email,
        role: `${mapAccessRoleLabel(entry.role)} (${entry.machineName})`,
        time: formatDateTime(entry.createdAt),
        actionText: entry.revokedAt
          ? "потерял доступ для пользователя"
          : "выдал доступ пользователю",
        sortValue: entry.createdAt,
      };
    }),
    ...[...invitesByMachine.entries()].flatMap(([machineId, machineInvites]) => {
      const machine = machineMap.get(machineId);
      if (!machine) return [];

      return machineInvites.map((invite) => ({
        id: `invite_${machineId}_${invite.id}`,
        actor: knownUserEmails.get(invite.invited_by_user_id) ?? "Система",
        email: invite.email,
        role: `${mapAccessRoleLabel(invite.role)} (${getMachineResource(machine)})`,
        time: formatDateTime(invite.created_at),
        actionText:
          invite.status === "pending"
            ? "отправил приглашение пользователю"
            : "обновил статус приглашения для",
        sortValue: invite.created_at,
      }));
    }),
  ]
    .sort(
      (left, right) =>
        new Date(right.sortValue).getTime() - new Date(left.sortValue).getTime(),
    )
    .slice(0, 8)
    .map(({ sortValue: _sortValue, ...item }) => item);

  const machinesForInvites = machines
    .map((machine) => ({
      id: machine.id,
      resource: getMachineResource(machine),
      role: mapAccessRoleLabel(machine.my_role),
      roleValue: machine.my_role,
      canInvite: machine.my_role === "owner" || machine.my_role === "admin",
      availableRoleValues: mapAssignableAccessRoles(machine.my_role),
    }))
    .filter((machine) => machine.canInvite);

  return {
    metrics: [
      baseMetrics.find((metric) => metric.id === "users_total") ?? {
        id: "users_total",
        title: "Всего пользователей",
        value: "0",
        tone: "highlight",
      },
      {
        id: "admins_total",
        title: "Администраторов",
        value: String(uniqueAdmins.size),
        tone: "default",
      },
      {
        id: "agents_total",
        title: "Всего машин",
        value: String(machines.length),
        tone: "default",
      },
      baseMetrics.find((metric) => metric.id === "invites_pending") ?? {
        id: "invites_pending",
        title: "Ожидают приглашение",
        value: "0",
        tone: "default",
      },
    ],
    machines: machinesForInvites,
    users,
    invites,
    activity,
  };
}

export const api = {
  hasPersistedAuthToken,
  clearPersistedAuthToken,

  async getProfileDashboard(): Promise<ProfileDashboardResponse> {
    const response = await request<BackendMeResponse>("/auth/me");
    const { firstName, lastName } = deriveNameFromEmail(response.user.email);
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      userId: response.user.id,
      email: response.user.email,
      firstName,
      lastName,
      fullName: fullName || "Имя Фамилия",
      isActive: response.user.is_active,
      emailVerified: response.user.email_verified,
      sessionKind: response.session_kind,
      twoFactorEnabled: response.two_factor_enabled,
      enabledTwoFactorMethods: response.enabled_two_factor_methods,
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await request<BackendAuthSessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        client_kind: AUTH_CLIENT_KIND,
      }),
    });

    if (response.requires_two_factor) {
      return {
        requiresConfirmation: true,
        challengeId: response.challenge_id ?? undefined,
      };
    }

    return {};
  },

  register(email: string, password: string): Promise<AuthResponse> {
    return request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        client_kind: AUTH_CLIENT_KIND,
      }),
    }).then(() => ({ requiresConfirmation: true }));
  },

  async confirm(
    email: string,
    code: string,
    challengeId?: string,
  ): Promise<AuthResponse> {
    const response = challengeId
      ? await request<BackendAuthSessionResponse>("/auth/login/2fa/totp", {
          method: "POST",
          body: JSON.stringify({
            challenge_id: challengeId,
            code,
            client_kind: AUTH_CLIENT_KIND,
          }),
        })
      : await request<BackendAuthSessionResponse>("/auth/register/verify", {
          method: "POST",
          body: JSON.stringify({
            email,
            code,
            client_kind: AUTH_CLIENT_KIND,
          }),
        });

    return {};
  },

  logout(): Promise<void> {
    return request("/auth/logout", {
      method: "POST",
    });
  },

  async getMachines(): Promise<MachineCardResponse[]> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    return machines.map(mapMachineSummary);
  },

  async confirmMachineRegistration(input: {
    deviceCode: string;
    displayName?: string;
  }): Promise<MachineCardResponse> {
    const response = await request<{ machine: BackendMachineDetail }>(
      "/machines/registrations/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          device_code: input.deviceCode.trim().toUpperCase(),
          display_name: input.displayName?.trim() || undefined,
        }),
      },
    );

    return mapMachineSummary(response.machine);
  },

  async getMachineCommandTemplates(
    machineId: string,
  ): Promise<CommandTemplateOption[]> {
    const templates = await request<BackendCommandTemplateRead[]>(
      `/machines/${encodeURIComponent(machineId)}/commands/templates`,
    );

    return templates.map((template) => ({
      id: template.id,
      templateKey: template.template_key,
      name: template.name,
      description: template.description,
      runner: template.runner,
      commandPattern: template.command_pattern,
      parserKind: template.parser_kind,
      parameters: template.parameters.map((parameter) => ({
        key: parameter.key,
        label: parameter.label,
        allowedValues: parameter.allowed_values,
      })),
    }));
  },

  async createTask(input: {
    machineId: string;
    templateKey: string;
    params?: Record<string, string>;
  }): Promise<void> {
    await request("/tasks", {
      method: "POST",
      body: JSON.stringify({
        machine_id: input.machineId,
        template_key: input.templateKey,
        params: input.params ?? {},
      }),
    });
  },

  async retryTask(taskId: string): Promise<void> {
    await request(`/tasks/${encodeURIComponent(taskId)}/retry`, {
      method: "POST",
    });
  },

  async cancelTask(taskId: string): Promise<void> {
    await request(`/tasks/${encodeURIComponent(taskId)}/cancel`, {
      method: "POST",
    });
  },

  async getHomeDashboard(): Promise<HomeDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineCards = machines.map(mapMachineSummary);
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));
    const userEmailMap = await loadUserEmailMap(
      machines.map((machine) => machine.id),
    );
    const taskCards = tasks.map((task) =>
      mapTask(task, machineMap, userEmailMap),
    );

    const onlineCount = machineCards.filter(
      (machine) => machine.status === "online",
    ).length;
    const activeTaskCount = taskCards.filter(
      (task) => task.status === "in_progress",
    ).length;
    const errorTaskCount = taskCards.filter(
      (task) => task.status === "error",
    ).length;
    const onlineProgress = machineCards.length
      ? Math.round((onlineCount / machineCards.length) * 100)
      : 0;

    return {
      metrics: [
        {
          id: "total",
          title: "Всего агентов",
          value: String(machineCards.length),
          detailValue: String(onlineCount),
          detailText: "онлайн",
          trendIconSrc: "/upplus.png",
          iconSrc: "/PC.png",
          accent: "blue",
        },
        {
          id: "online",
          title: "В сети (онлайн)",
          value: String(onlineCount),
          iconSrc: "/inet.png",
          accent: "green",
          progress: onlineProgress,
          progressLeft: "Онлайн",
          progressRight: "Офлайн",
        },
        {
          id: "tasks",
          title: "Активные задачи",
          value: String(activeTaskCount),
          detailValue: String(taskCards.length),
          detailText: "всего задач",
          trendIconSrc: "/upred.png",
          iconSrc: "/3card.png",
          accent: "yellow",
        },
        {
          id: "errors",
          title: "Ошибок за день",
          value: String(errorTaskCount),
          detailValue: String(Math.max(0, taskCards.length - errorTaskCount)),
          detailText: "успешных задач",
          trendIconSrc: "/downgreen.png",
          iconSrc: "/error.png",
          accent: "red",
        },
      ],
      actions: [
        { label: "Добавить агента", iconSrc: "/addagent.png" },
        { label: "Создать задачу", iconSrc: "/plus.png" },
        { label: "Открыть логи", iconSrc: "/logicard.png" },
        { label: "Управление", iconSrc: "/4card.png" },
      ],
      errors: taskCards
        .filter((task) => task.status === "error")
        .slice(0, 3)
        .map((task) => ({
          title: `Ошибка в задаче №${task.taskNumber}`,
          createdAt: `Запущена ${task.startedAt}`,
          stoppedAt: task.completedAt
            ? `Завершена ${task.completedAt}`
            : "Завершение отсутствует",
          ago: "Недавно",
        })),
      tasks: tasks.slice(0, 8).map((task) => {
        const presentation = getTaskPresentation(task.status);
        const machineDigits = extractDigits(task.machine_id);
        const serverNumber = machineDigits || task.machine_id.slice(0, 6);
        const lastAttempt = task.attempts[task.attempts.length - 1];
        const createdAt = formatDateTime(
          lastAttempt?.started_at ?? lastAttempt?.queued_at ?? task.created_at,
        );
        const machine = machineMap.get(task.machine_id);

        return {
          id: extractDigits(task.id) || task.id.slice(0, 6),
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || `Сервер №${serverNumber}`,
          ),
          status: presentation.taskStatusLabel,
          createdAt,
          sender:
            userEmailMap.get(task.requested_by_user_id) ??
            task.requested_by_user_id,
        };
      }),
    };
  },

  async getTasks(): Promise<TaskCardResponse[]> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));
    const userEmailMap = await loadUserEmailMap(
      machines.map((machine) => machine.id),
    );

    return tasks.map((task) => mapTask(task, machineMap, userEmailMap));
  },

  async getTask(taskId: string): Promise<TaskDetailResponse> {
    const task = await request<BackendTaskRead>(
      `/tasks/${encodeURIComponent(taskId)}`,
    );
    const [machines, userEmailMap] = await Promise.all([
      request<BackendMachineSummary[]>("/machines"),
      loadUserEmailMap([task.machine_id]),
    ]);
    const machine = machines.find((item) => item.id === task.machine_id);
    const presentation = getTaskPresentation(task.status);
    const lastAttempt = task.attempts[task.attempts.length - 1];

    return {
      id: task.id,
      machineId: task.machine_id,
      machine: normalizeMachineTitle(
        machine?.display_name || machine?.hostname || task.machine_id,
      ),
      title: task.template_name,
      templateKey: task.template_key,
      renderedCommand: getTaskRenderedCommand(task),
      requestedBy:
        userEmailMap.get(task.requested_by_user_id) ?? task.requested_by_user_id,
      status: presentation.group,
      statusLabel: presentation.taskStatusLabel,
      resultText: presentation.resultLabel,
      startedAt: formatDateTime(
        lastAttempt?.started_at ?? lastAttempt?.queued_at ?? task.created_at,
      ),
      completedAt:
        lastAttempt?.finished_at != null
          ? formatDateTime(lastAttempt.finished_at)
          : undefined,
    };
  },

  async getTaskLogs(taskId: string): Promise<TaskLogLineResponse[]> {
    const logs = await request<BackendTaskLogEntry[]>(
      `/tasks/${encodeURIComponent(taskId)}/logs`,
    );

    return [...logs]
      .sort((left, right) => left.sequence - right.sequence)
      .map((entry) => ({
        id: entry.id,
        attemptId: entry.attempt_id,
        stream: entry.stream,
        sequence: entry.sequence,
        text: entry.chunk,
        createdAt: formatDateTime(entry.created_at),
        createdAtIso: entry.created_at,
      }));
  },

  async getLogsDashboard(): Promise<LogsDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const userEmailMap = await loadUserEmailMap(
      machines.map((machine) => machine.id),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));

    const recentTasks = tasks.slice(0, 50);
    const logsByTask = await loadTaskLogs(recentTasks.map((task) => task.id));

    const entries = recentTasks
      .map((task) => {
        const tone = mapLogTone(task.status);
        const status = mapLogStatusLabel(task.status);
        const machine = machineMap.get(task.machine_id);
        const taskLogs = logsByTask.get(task.id) ?? [];
        const latestLog = taskLogs[taskLogs.length - 1];
        const action = latestLog
          ? shortenText(latestLog.chunk)
          : `Запуск шаблона ${task.template_name}`;
        const createdAtIso = pickTaskEventDate(task, taskLogs);

        return {
          id: task.id,
          taskId: task.id,
          machineId: task.machine_id,
          taskTitle: task.template_name,
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || task.machine_id,
          ),
          action,
          email:
            userEmailMap.get(task.requested_by_user_id) ??
            task.requested_by_user_id,
          status,
          tone,
          createdAt: formatDateTime(createdAtIso),
          renderedCommand: getTaskRenderedCommand(task),
          createdAtIso,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAtIso).getTime() -
          new Date(a.createdAtIso).getTime(),
      );

    const streamItems = recentTasks.flatMap((task) => {
      const machine = machineMap.get(task.machine_id);
      const machineLabel = normalizeMachineTitle(
        machine?.display_name || machine?.hostname || task.machine_id,
      );
      const taskLogs = logsByTask.get(task.id) ?? [];
      const taskStartedAt = pickTaskCreatedAtIso(task);
      const items: LogsDashboardResponse["streamItems"] = [
        {
          id: `${task.id}:request`,
          taskId: task.id,
          machineId: task.machine_id,
          kind: "request",
          machine: machineLabel,
          title: task.template_name,
          text: getTaskRenderedCommand(task),
          createdAt: formatDateTime(taskStartedAt),
          createdAtIso: taskStartedAt,
        },
      ];

      taskLogs.forEach((logEntry, index) => {
        const logText = shortenText(logEntry.chunk, 240);
        if (!logText) return;

        items.push({
          id: `${task.id}:response:${index}`,
          taskId: task.id,
          machineId: task.machine_id,
          kind: "response",
          machine: machineLabel,
          title: task.template_name,
          text: logText,
          createdAt: formatDateTime(logEntry.created_at),
          createdAtIso: logEntry.created_at,
        });
      });

      return items;
    });

    const streamLines = streamItems
      .slice(-60)
      .map((item) =>
        formatLogStreamLine({
          kind: item.kind,
          createdAt: item.createdAtIso,
          machine: item.machine,
          text: item.text,
        }),
      );

    return {
      entries: entries.map(({ createdAtIso, ...entry }) => entry),
      streamItems,
      streamLines,
    };
  },

  async getReportsDashboard(): Promise<ReportsDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const userEmailMap = await loadUserEmailMap(
      machines.map((machine) => machine.id),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));

    const reportTasks = tasks
      .map((task) => {
        const machine = machineMap.get(task.machine_id);
        return {
          id: task.id,
          machineId: task.machine_id,
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || task.machine_id,
          ),
          machineStatus: machine ? mapMachineStatus(machine.status) : "offline",
          templateName: task.template_name,
          requestedBy:
            userEmailMap.get(task.requested_by_user_id) ??
            task.requested_by_user_id,
          status: getTaskPresentation(task.status).group,
          createdAtIso: pickTaskCreatedAtIso(task),
          durationMs: pickTaskDurationMs(task),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAtIso).getTime() -
          new Date(a.createdAtIso).getTime(),
      );

    return { tasks: reportTasks };
  },

  async getResultsDashboard(): Promise<ResultsDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));
    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    const results = await loadMachineResults(machines.map((machine) => machine.id));

    const rows = results
      .map((result) => {
        const machine = machineMap.get(result.machine_id);
        const task = taskMap.get(result.task_id);
        const statusTone: ResultsDashboardResponse["rows"][number]["statusTone"] =
          result.exit_code === 0 ? "success" : "error";

        return {
          id: result.id,
          taskId: result.task_id,
          machineId: result.machine_id,
          title: result.template_name,
          statusLabel: statusTone === "success" ? "Выполнено" : "Ошибка",
          statusTone,
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || result.machine_id,
          ),
          command: task ? getTaskRenderedCommand(task) : result.template_name,
          resultAt: formatResultDateTime(result.created_at),
          resultAtIso: result.created_at,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.resultAtIso).getTime() - new Date(a.resultAtIso).getTime(),
      );

    return { rows };
  },

  async getResult(resultId: string): Promise<ResultDetailResponse> {
    const result = await request<BackendResultRead>(
      `/results/${encodeURIComponent(resultId)}`,
    );

    return {
      id: result.id,
      taskId: result.task_id,
      parserKind: result.parser_kind,
      summary: result.summary,
      parsedPayload: result.parsed_payload ?? null,
      createdAt: formatDateTime(result.created_at),
      shell: {
        command: result.shell.command,
        stdout: result.shell.stdout,
        stderr: result.shell.stderr,
        exitCode: result.shell.exit_code,
        durationMs: result.shell.duration_ms,
      },
    };
  },

  async getAccessDashboard(): Promise<AccessDashboardResponse> {
    return buildAccessDashboard();

    /*
    const machines = await request<BackendMachineSummary[]>("/machines");

    const accessSettled = await Promise.allSettled(
      machines.map((machine) =>
        request<BackendMachineAccessEntry[]>(
          `/machines/${encodeURIComponent(machine.id)}/access`,
        ).then((entries) => ({ machine, entries })),
      ),
    );

    const accessRows = accessSettled
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          machine: BackendMachineSummary;
          entries: BackendMachineAccessEntry[];
        }> => result.status === "fulfilled",
      )
      .flatMap((result) =>
        result.value.entries.map((entry) => ({
          machine: result.value.machine,
          entry,
        })),
      );

    const activeRows = accessRows.filter((row) => !row.entry.revoked_at);
    const uniqueUsers = new Set(activeRows.map((row) => row.entry.user_id));
    const uniqueAdmins = new Set(
      activeRows
        .filter((row) => row.entry.role === "admin")
        .map((row) => row.entry.user_id),
    );

    const agentsOnline = machines.filter(
      (machine) => machine.status === "online",
    ).length;

    const knownUserEmails = new Map<string, string>();
    for (const row of accessRows) {
      knownUserEmails.set(row.entry.user_id, row.entry.email);
    }

    const users = accessRows
      .sort((a, b) => {
        const aIsActive = a.entry.revoked_at ? 0 : 1;
        const bIsActive = b.entry.revoked_at ? 0 : 1;
        if (aIsActive !== bIsActive) return bIsActive - aIsActive;
        return a.entry.email.localeCompare(b.entry.email);
      })
      .map(({ machine, entry }) => {
        const status = mapAccessStatus(entry);
        return {
          id: `${machine.id}_${entry.id}`,
          email: entry.email,
          role: mapAccessRoleLabel(entry.role),
          roleTone: mapAccessRoleTone(entry.role),
          resource: machine.display_name || machine.hostname,
          status: status.status,
          statusTone: status.statusTone,
          action: entry.revoked_at ? "-" : "Отозвать",
        };
      });

    const activity = accessRows
      .sort(
        (a, b) =>
          new Date(b.entry.created_at).getTime() -
          new Date(a.entry.created_at).getTime(),
      )
      .slice(0, 8)
      .map(({ machine, entry }) => ({
        id: `${machine.id}_${entry.id}`,
        actor:
          (entry.granted_by_user_id
            ? knownUserEmails.get(entry.granted_by_user_id)
            : undefined) ?? "Система",
        email: entry.email,
        role: `${mapAccessRoleLabel(entry.role)} (${machine.display_name || machine.hostname})`,
        time: formatDateTime(entry.created_at),
        actionText: "выдал доступ пользователю",
      }));

    return {
      metrics: [
        {
          id: "users_total",
          title: "Всего пользователей",
          value: String(uniqueUsers.size),
          tone: "highlight",
        },
        {
          id: "admins_total",
          title: "Администраторов",
          value: String(uniqueAdmins.size),
          tone: "default",
        },
        {
          id: "agents_total",
          title: "Всего агентов",
          value: String(machines.length),
          tone: "default",
        },
        {
          id: "agents_online",
          title: "Онлайн",
          value: String(agentsOnline),
          tone: "default",
        },
      ],
      users,
      activity,
    };
    */
  },

  async reauth(password: string): Promise<string> {
    const response = await request<BackendReauthResponse>("/auth/re-auth", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    return response.reauth_token;
  },

  async createMachineInvite(input: {
    machineId: string;
    email: string;
    role: AssignableAccessRole;
    reauthToken: string;
  }): Promise<void> {
    await request(`/machines/${encodeURIComponent(input.machineId)}/invites`, {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        role: input.role,
        reauth_token: input.reauthToken,
      }),
    });
  },

  async updateMachineAccessRole(input: {
    machineId: string;
    accessId: string;
    role: AssignableAccessRole;
    reauthToken: string;
  }): Promise<void> {
    await request(
      `/machines/${encodeURIComponent(input.machineId)}/access/${encodeURIComponent(input.accessId)}/role`,
      {
        method: "POST",
        body: JSON.stringify({
          role: input.role,
          reauth_token: input.reauthToken,
        }),
      },
    );
  },

  async revokeMachineAccess(input: {
    machineId: string;
    accessId: string;
    reauthToken: string;
  }): Promise<void> {
    await request(
      `/machines/${encodeURIComponent(input.machineId)}/access/${encodeURIComponent(input.accessId)}/revoke`,
      {
        method: "POST",
        body: JSON.stringify({
          reauth_token: input.reauthToken,
        }),
      },
    );
  },
};
