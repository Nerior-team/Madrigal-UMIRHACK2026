import {
  formatMoscowDateTime,
  normalizeMachineOsLabel,
  normalizeMachineTitle,
} from "./ui";

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
  taskNumber: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  serverNumber: string;
  resultText: string;
  resultColor: "green" | "yellow" | "red";
  status: "completed" | "in_progress" | "error";
}

export interface AccessDashboardResponse {
  metrics: Array<{
    id: string;
    title: string;
    value: string;
    tone?: "default" | "highlight";
  }>;
  users: Array<{
    id: string;
    email: string;
    role: string;
    roleTone: "viewer" | "admin" | "operator" | "owner";
    resource: string;
    status: string;
    statusTone: "active" | "pending";
    action: string;
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
    machine: string;
    action: string;
    email: string;
    status: string;
    tone: "success" | "warning" | "critical";
    createdAt: string;
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
    machineId: string;
    title: string;
    statusLabel: string;
    statusTone: "success" | "error" | "cancelled";
    machine: string;
    command: string;
    resultAt: string;
    resultAtIso: string;
  }>;
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

type BackendCommandTemplateRead = {
  id?: string | null;
  template_key: string;
  name: string;
  description?: string | null;
  runner: string;
  parameters: Array<{
    key: string;
    label: string;
    allowed_values: string[];
  }>;
  parser_kind: string;
};

type BackendTaskStatus =
  | "queued"
  | "dispatched"
  | "accepted"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

type BackendTaskAttempt = {
  queued_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
};

type BackendTaskRead = {
  id: string;
  machine_id: string;
  template_key: string;
  template_name: string;
  status: BackendTaskStatus;
  requested_by_user_id: string;
  created_at: string;
  attempts: BackendTaskAttempt[];
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

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
).replace(/\/$/, "");
const AUTH_CLIENT_KIND: BackendSessionKind = "desktop";

const AUTH_TOKEN_KEY = "umirhack-auth-token";

function readAuthToken(): string {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistAuthToken(token?: string): void {
  if (!token) return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage failures and continue with in-memory session.
  }
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

function mapTaskStatus(status: BackendTaskStatus): TaskCardResponse["status"] {
  if (status === "succeeded") return "completed";
  if (status === "failed" || status === "cancelled") return "error";
  return "in_progress";
}

function mapTaskResultColor(
  status: TaskCardResponse["status"],
): TaskCardResponse["resultColor"] {
  if (status === "completed") return "green";
  if (status === "error") return "red";
  return "yellow";
}

function mapTaskResultText(status: TaskCardResponse["status"]): string {
  if (status === "completed") return "Задача завершена";
  if (status === "error") return "Задача завершилась ошибкой";
  return "Задача выполняется";
}

function mapResultStatus(
  status: BackendTaskStatus,
): ResultsDashboardResponse["rows"][number]["statusTone"] {
  if (status === "succeeded") return "success";
  if (status === "failed") return "error";
  return "cancelled";
}

function mapResultStatusLabel(status: BackendTaskStatus): string {
  if (status === "succeeded") return "Выполнено";
  if (status === "failed") return "Ошибка";
  if (status === "cancelled") return "Отменено";
  return "В процессе";
}

function mapTask(
  task: BackendTaskRead,
  machineMap: Map<string, BackendMachineSummary>,
): TaskCardResponse {
  const mappedStatus = mapTaskStatus(task.status);
  const resultColor = mapTaskResultColor(mappedStatus);
  const resultText = mapTaskResultText(mappedStatus);
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
    mappedStatus === "in_progress"
      ? undefined
      : formatDateTime(lastAttempt?.finished_at ?? task.created_at);

  return {
    id: task.id,
    machineId: task.machine_id,
    machine: normalizeMachineTitle(
      machine?.display_name || machine?.hostname || task.machine_id,
    ),
    templateKey: task.template_key,
    taskNumber,
    title: taskTitle,
    startedAt,
    completedAt,
    serverNumber,
    resultText,
    resultColor,
    status: mappedStatus,
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

function mapLogTone(
  status: TaskCardResponse["status"],
): LogsDashboardResponse["entries"][number]["tone"] {
  if (status === "completed") return "success";
  if (status === "error") return "critical";
  return "warning";
}

function mapLogStatusLabel(status: TaskCardResponse["status"]): string {
  if (status === "completed") return "Завершено";
  if (status === "error") return "Критично";
  return "Требует внимания";
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
  const token = readAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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

export const api = {
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

    const token = response.tokens?.access_token;
    persistAuthToken(token);
    return { token };
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

    const token = response.tokens?.access_token;
    persistAuthToken(token);
    return { token };
  },

  async getMachines(): Promise<MachineCardResponse[]> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    return machines.map(mapMachineSummary);
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

  async getHomeDashboard(): Promise<HomeDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineCards = machines.map(mapMachineSummary);
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));
    const taskCards = tasks.map((task) => mapTask(task, machineMap));

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
        const mappedStatus = mapTaskStatus(task.status);
        const machineDigits = extractDigits(task.machine_id);
        const serverNumber = machineDigits || task.machine_id.slice(0, 6);
        const lastAttempt = task.attempts[task.attempts.length - 1];
        const createdAt = formatDateTime(
          lastAttempt?.started_at ?? lastAttempt?.queued_at ?? task.created_at,
        );

        return {
          id: extractDigits(task.id) || task.id.slice(0, 6),
          machine: `Сервер №${serverNumber}`,
          status:
            mappedStatus === "completed"
              ? "Завершено"
              : mappedStatus === "error"
                ? "Ошибка"
                : "В процессе",
          createdAt,
          sender: task.requested_by_user_id,
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

    return tasks.map((task) => mapTask(task, machineMap));
  },

  async getLogsDashboard(): Promise<LogsDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
    );
    const tasks = await loadMachineTasks(machines.map((machine) => machine.id));

    const recentTasks = tasks.slice(0, 50);
    const logsByTask = await loadTaskLogs(recentTasks.map((task) => task.id));

    const entries = recentTasks
      .map((task) => {
        const mappedStatus = mapTaskStatus(task.status);
        const tone = mapLogTone(mappedStatus);
        const status = mapLogStatusLabel(mappedStatus);
        const machine = machineMap.get(task.machine_id);
        const taskLogs = logsByTask.get(task.id) ?? [];
        const latestLog = taskLogs[taskLogs.length - 1];
        const action = latestLog
          ? shortenText(latestLog.chunk)
          : `Запуск шаблона ${task.template_name}`;
        const createdAtIso = pickTaskEventDate(task, taskLogs);

        return {
          id: task.id,
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || task.machine_id,
          ),
          action,
          email: task.requested_by_user_id,
          status,
          tone,
          createdAt: formatDateTime(createdAtIso),
          createdAtIso,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAtIso).getTime() -
          new Date(a.createdAtIso).getTime(),
      );

    const streamLines = entries
      .slice(0, 40)
      .map(
        (entry) =>
          `[${entry.createdAt}] ${entry.machine}: ${entry.action} (${entry.status})`,
      );

    return {
      entries: entries.map(({ createdAtIso, ...entry }) => entry),
      streamLines,
    };
  },

  async getReportsDashboard(): Promise<ReportsDashboardResponse> {
    const machines = await request<BackendMachineSummary[]>("/machines");
    const machineMap = new Map(
      machines.map((machine) => [machine.id, machine]),
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
          requestedBy: task.requested_by_user_id,
          status: mapTaskStatus(task.status),
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

    const rows = tasks
      .map((task) => {
        const machine = machineMap.get(task.machine_id);
        const latestAttempt = task.attempts[task.attempts.length - 1];
        const resultAtIso =
          latestAttempt?.finished_at ??
          latestAttempt?.started_at ??
          latestAttempt?.queued_at ??
          task.created_at;

        return {
          id: task.id,
          machineId: task.machine_id,
          title: task.template_name,
          statusLabel: mapResultStatusLabel(task.status),
          statusTone: mapResultStatus(task.status),
          machine: normalizeMachineTitle(
            machine?.display_name || machine?.hostname || task.machine_id,
          ),
          command: `predict run ${task.template_name}`,
          resultAt: formatResultDateTime(resultAtIso),
          resultAtIso,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.resultAtIso).getTime() - new Date(a.resultAtIso).getTime(),
      );

    return { rows };
  },

  async getAccessDashboard(): Promise<AccessDashboardResponse> {
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
  },
};
