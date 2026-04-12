import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Monitor,
  Percent,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Laptop,
  X,
} from "lucide-react";
import {
  api,
  accountApi,
  type AccessDashboardResponse,
  type AccountMachineScopeOption,
  type AccountNotification,
  type AccountProfileDetails,
  type AccountSession,
  type ApiKeyExpiryPreset,
  type ApiKeyPermission,
  type ApiKeyRead,
  type CommandTemplateOption,
  type DeletedMachineRetention,
  type LogsDashboardResponse,
  type ProfileDashboardResponse,
  type ResultsDashboardResponse,
  type ReportsDashboardResponse,
  type TaskCardResponse,
  type TotpSetupStart,
} from "./core";
import { ApiError } from "./core/http";
import {
  matchesSearchQuery,
  normalizeMachineTitle,
} from "./core/ui";
import {
  getRetentionLabel,
  getSessionKindLabel,
  summarizeSession,
  validatePasswordPolicy,
} from "./core/account-ui";
import {
  authPath,
  addMachinePath,
  logsPath,
  machineResultPath,
  machineTaskLogsPath,
  machinePath,
  profilePath,
  resolveAppRoute,
  resultPath,
  taskLogsPath,
  taskPath,
  workspacePath,
} from "./core/routes";
import {
  buildTaskPreview,
  getTaskPreviewShellLabel,
} from "./core/task-preview";
import { buildTaskSections } from "./core/operations";
import { buildLogsScopeSummary } from "./core/logs";
import {
  buildResultsFilterOptions,
  filterResultRows,
  type ResultDateRange,
  type ResultStatusTone,
} from "./core/results";
import {
  bootstrapAuthSession,
} from "./app/auth-session";
import {
  applyThemeMode,
  resolveInitialThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "./app/theme";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import {
  getSearchMatches,
  type SearchMatch,
  type SearchTarget,
} from "./core/search";
import { ConsoleModal } from "./components/operations/ConsoleModal";
import { LogsWorkspace } from "./components/operations/logs/LogsWorkspace";
import { ResultDetailModal } from "./components/operations/ResultDetailModal";
import { AddMachineCard } from "./components/operations/machine/AddMachineCard";
import { MachineWorkspace } from "./components/operations/machine/MachineWorkspace";
import { ReportsWorkspace } from "./components/operations/reports/ReportsWorkspace";
import { InviteAccessModal } from "./components/access/InviteAccessModal";
import { ManageAccessModal } from "./components/access/ManageAccessModal";
import { ResultsWorkspace } from "./components/operations/results/ResultsWorkspace";
import { TasksWorkspace } from "./components/operations/tasks/TasksWorkspace";
import { ProfileWorkspace } from "./components/profile/ProfileWorkspace";
import { CustomSelect } from "./components/primitives/CustomSelect";
import { ProfileGeneralSection } from "./components/profile/ProfileGeneralSection";
import { ProfileSecuritySection } from "./components/profile/ProfileSecuritySection";
import { ProfileSessionsSection } from "./components/profile/ProfileSessionsSection";
import { ProfileNotificationsSection } from "./components/profile/ProfileNotificationsSection";
import { ApiKeysWorkspace } from "./components/profile/ApiKeysWorkspace";
import { EmptyState } from "./components/primitives/EmptyState";
import type { ProfileSectionKey } from "./components/profile/types";

const apiClient = api;
const AGENT_PAIR_COMMAND = "predict pair --backend-url https://nerior.store";

type AuthMode =
  | "login"
  | "register"
  | "confirm"
  | "forgot-password"
  | "reset-password";
type AppScreen = "auth" | "machines";
type WorkspaceTab =
  | "home"
  | "machines"
  | "tasks"
  | "results"
  | "logs"
  | "access"
  | "reports"
  | "install"
  | "profile";

type MachineCardStatus = "online" | "running" | "offline" | "deleted";

type MachineDashboardCard = {
  id: string;
  machine: string;
  hostname: string;
  os: string;
  heartbeat: string;
  owner: string;
  myRole: string;
  initials?: string;
  status: MachineCardStatus;
  badgeTone: "violet" | "cyan" | "green";
};

type MenuItem = {
  label: string;
  iconSrc: string;
  tab?: WorkspaceTab;
};

type HomeMetricCard = {
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
};

type HomeErrorItem = {
  title: string;
  createdAt: string;
  stoppedAt: string;
  ago: string;
};

type HomeActionCard = {
  label: string;
  iconSrc: string;
};

type HomeTaskRow = {
  id: string;
  machine: string;
  status: string;
  createdAt: string;
  sender: string;
};

type TaskCard = TaskCardResponse;

type TaskFilterStatus = "all" | TaskCard["status"];

type AccessSummaryCard = AccessDashboardResponse["metrics"][number];
type AccessUserRow = AccessDashboardResponse["users"][number];
type AccessInviteRow = AccessDashboardResponse["invites"][number];
type AccessActivityItem = AccessDashboardResponse["activity"][number];
type AccessManageableMachine = AccessDashboardResponse["machines"][number];

type LogStatusTone = "success" | "warning" | "critical";
type LogEntry = LogsDashboardResponse["entries"][number];
type LogStreamItem = LogsDashboardResponse["streamItems"][number];
type ReportPeriod = "day" | "week" | "month" | "all";
type ReportTaskItem = ReportsDashboardResponse["tasks"][number];

type ReportSummaryRow = {
  id: string;
  title: string;
  totalTasks: number;
  successCount: number;
  errorCount: number;
  avgDurationMs?: number;
  actionLabel: string;
};

type ReportComparisonStats = {
  averageDurationMs: number;
  totalTasks: number;
  activeMachines: number;
  errorTasks: number;
  successRate: number;
};

type ResultHistoryRow = ResultsDashboardResponse["rows"][number];

function getReportComparisonStats(
  tasks: ReportTaskItem[],
): ReportComparisonStats {
  const durations = tasks
    .map((task) => task.durationMs)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const averageDurationMs = durations.length
    ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    : 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const errorTasks = tasks.filter((task) => task.status === "error").length;
  const finishedTasks = completedTasks + errorTasks;
  const activeMachines = new Set(
    tasks
      .filter(
        (task) =>
          task.machineStatus === "online" || task.machineStatus === "running",
      )
      .map((task) => task.machineId),
  ).size;

  return {
    averageDurationMs,
    totalTasks: tasks.length,
    activeMachines,
    errorTasks,
    successRate: finishedTasks ? (completedTasks / finishedTasks) * 100 : 100,
  };
}
const machineStatusSections = [
  { key: "online", label: "Онлайн" },
  { key: "running", label: "Выполняют задачу" },
  { key: "offline", label: "Оффлайн" },
  { key: "deleted", label: "Удалённые" },
] as const;

const machineStatusLabelByStatus: Record<MachineCardStatus, string> = {
  online: "Онлайн",
  running: "Выполняет задачу",
  offline: "Оффлайн",
  deleted: "Удалена",
};

function getMachineDisplayName(card: MachineDashboardCard): string {
  return normalizeMachineTitle(card.machine);
}

function formatDurationLong(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "0 с";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${totalSeconds} с`;
  }

  return `${minutes} мин ${seconds} с`;
}

function formatDurationCompact(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "—";
  }

  if (durationMs >= 60_000) {
    return `${(durationMs / 60_000).toFixed(1)} мин`;
  }

  if (durationMs >= 1_000) {
    return `${(durationMs / 1_000).toFixed(1)} с`;
  }

  return `${Math.round(durationMs)} мс`;
}

function getReportTemplateIcon(templateTitle: string): string {
  return templateTitle.trim().toLowerCase() === "db-sync"
    ? "/sync.png"
    : "/zadachi.png";
}

const menuItems: MenuItem[] = [
  { label: "Главная", iconSrc: "/main.png", tab: "home" },
  { label: "Машины", iconSrc: "/machines.png", tab: "machines" },
  { label: "Задачи", iconSrc: "/zadachi.png", tab: "tasks" },
  { label: "Результаты", iconSrc: "/res.png", tab: "results" },
  { label: "Логи", iconSrc: "/logs.png", tab: "logs" },
  { label: "Доступ", iconSrc: "/access.png", tab: "access" },
  { label: "Отчёты", iconSrc: "/otch.png", tab: "reports" },
];

const WINDOWS_DAEMON_INSTALL_URL =
  "https://nerior.store/downloads/windows/PredictMVDaemonSetup.exe";
const LINUX_ARCHIVE_INSTALL_URL =
  "https://nerior.store/downloads/linux/predictmv-linux-x64.tar.gz";

const linuxInstallGuideSteps: Array<{ title: string; commands: string[] }> = [
  {
    title: "Установка",
    commands: [
      "curl -fsSL https://nerior.store/downloads/linux/install.sh -o install.sh",
      "chmod +x install.sh",
      "sudo bash install.sh",
    ],
  },
  {
    title: "Проверка установки и связка агента",
    commands: [
      "sudo /usr/local/bin/predict version",
      "sudo /usr/local/bin/predict pair --backend-url https://nerior.store",
    ],
  },
  {
    title: "Проверка связки и информация об агенте",
    commands: ["sudo /usr/local/bin/predict status"],
  },
];

const installCards: Array<{
  id: "windows" | "linux";
  title: string;
  versions: string[];
  actions: string[];
  activeActionIndex: number;
  hint: string;
}> = [
  {
    id: "windows",
    title: "Windows",
    versions: ["Windows 10 x64", "Windows 11 x64"],
    actions: ["Скачать установщик", "Desktop скоро"],
    activeActionIndex: 0,
    hint: "Сейчас доступен daemon-установщик. Desktop-клиент подключим сразу после сборки отдельного артефакта.",
  },
  {
    id: "linux",
    title: "Linux",
    versions: ["Ubuntu 22.04+ x86_64", "Debian 12+ x86_64"],
    actions: ["Команды установки", "Скачать архив"],
    activeActionIndex: 0,
    hint: "На Linux ставится только systemd-сервис без графического клиента.",
  },
];

const REPORT_PERIOD_WINDOW_MS: Record<ReportPeriod, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  all: Number.POSITIVE_INFINITY,
};

const ACCESS_ROWS_LIMIT = 10;
const SIDEBAR_ACTIVE_TOP_BY_TAB: Record<WorkspaceTab, number> = {
  home: 68,
  machines: 124,
  tasks: 180,
  results: 236,
  logs: 292,
  access: 348,
  reports: 404,
  install: 460,
  profile: 516,
};

const profileSections: Array<{ key: Exclude<ProfileSectionKey, "api-keys">; label: string }> = [
  { key: "general", label: "Основная информация" },
  { key: "security", label: "Безопасность" },
  { key: "sessions", label: "Активные сессии" },
  { key: "notifications", label: "Настройки уведомлений" },
];

function getInstallActionUrl(
  cardId: "windows" | "linux",
  actionLabel: string,
): string | null {
  if (cardId === "windows") {
    return WINDOWS_DAEMON_INSTALL_URL;
  }

  if (cardId === "linux" && actionLabel === "Скачать архив") {
    return LINUX_ARCHIVE_INSTALL_URL;
  }

  return null;
}

function renderLinuxInstallCommandTokens(commandLine: string) {
  if (
    commandLine ===
    "curl -fsSL https://nerior.store/downloads/linux/install.sh -o install.sh"
  ) {
    return (
      <>
        <span className="install-guide-modal__cmd-keyword">curl</span>{" "}
        <span className="install-guide-modal__cmd-flag">-fsSL</span>{" "}
        <span className="install-guide-modal__cmd-value">
          https://nerior.store/downloads/linux/install.sh
        </span>{" "}
        <span className="install-guide-modal__cmd-flag">-o</span>{" "}
        <span className="install-guide-modal__cmd-value">install.sh</span>
      </>
    );
  }

  if (commandLine === "chmod +x install.sh") {
    return (
      <>
        <span className="install-guide-modal__cmd-keyword">chmod</span>{" "}
        <span className="install-guide-modal__cmd-value">+x install.sh</span>
      </>
    );
  }

  if (commandLine === "sudo bash install.sh") {
    return (
      <>
        <span className="install-guide-modal__cmd-keyword">sudo bash</span>{" "}
        <span className="install-guide-modal__cmd-value">install.sh</span>
      </>
    );
  }

  if (
    commandLine ===
    "sudo /usr/local/bin/predict pair --backend-url https://nerior.store"
  ) {
    return (
      <>
        <span className="install-guide-modal__cmd-keyword">
          sudo /usr/local/bin/predict pair
        </span>{" "}
        <span className="install-guide-modal__cmd-flag">--backend-url</span>{" "}
        <span className="install-guide-modal__cmd-value">
          https://nerior.store
        </span>
      </>
    );
  }

  if (
    commandLine === "sudo /usr/local/bin/predict version" ||
    commandLine === "sudo /usr/local/bin/predict status"
  ) {
    return (
      <span className="install-guide-modal__cmd-value">{commandLine}</span>
    );
  }

  return <span className="install-guide-modal__cmd-value">{commandLine}</span>;
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const route = useMemo(
    () => resolveAppRoute(location.pathname, location.search),
    [location.pathname, location.search],
  );
  const screen: AppScreen = route.section === "auth" ? "auth" : "machines";
  const authMode: AuthMode =
    route.section === "auth"
      ? route.authMode
      : "login";
  const workspaceTab: WorkspaceTab =
    route.section === "workspace" ? route.workspaceTab : "machines";
  const isAddMachineRoute =
    route.section === "workspace" && route.workspaceTab === "machines"
      ? Boolean(route.isAddMachine)
      : false;
  const selectedMachineId = route.section === "workspace" ? route.machineId ?? null : null;
  const selectedMachineRouteTab =
    route.section === "workspace" ? route.machineTab ?? "dashboard" : "dashboard";
  const logContext = useMemo(
    () =>
      route.section === "workspace" && route.workspaceTab === "logs"
        ? {
            machineId: route.logMachineId ?? null,
            taskId: route.logTaskId ?? null,
          }
        : { machineId: null, taskId: null },
    [route],
  );
  const modalReturnTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "returnTo" in location.state &&
    typeof (location.state as { returnTo?: unknown }).returnTo === "string"
      ? ((location.state as { returnTo: string }).returnTo)
      : null;
  const [sessionReady, setSessionReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return resolveInitialThemeMode(
      window.localStorage.getItem(THEME_STORAGE_KEY),
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
    );
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authChallengeId, setAuthChallengeId] = useState<string | null>(null);
  const [machineDashboardCards, setMachineDashboardCards] = useState<
    MachineDashboardCard[]
  >([]);
  const [homeMetricCards, setHomeMetricCards] = useState<HomeMetricCard[]>([]);
  const [homeActionCards, setHomeActionCards] = useState<HomeActionCard[]>([]);
  const [homeErrorItems, setHomeErrorItems] = useState<HomeErrorItem[]>([]);
  const [homeTaskRows, setHomeTaskRows] = useState<HomeTaskRow[]>([]);
  const [taskCards, setTaskCards] = useState<TaskCard[]>([]);
  const [accessSummaryCards, setAccessSummaryCards] = useState<
    AccessSummaryCard[]
  >([]);
  const [accessMachines, setAccessMachines] = useState<AccessManageableMachine[]>(
    [],
  );
  const [accessUserRows, setAccessUserRows] = useState<AccessUserRow[]>([]);
  const [accessInviteRows, setAccessInviteRows] = useState<AccessInviteRow[]>(
    [],
  );
  const [accessActivityItems, setAccessActivityItems] = useState<
    AccessActivityItem[]
  >([]);
  const [accessNotice, setAccessNotice] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteMachineId, setInviteMachineId] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "admin" | "operator">(
    "viewer",
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);
  const [manageAccessRowId, setManageAccessRowId] = useState<string | null>(null);
  const [manageRole, setManageRole] = useState<"viewer" | "admin" | "operator">(
    "viewer",
  );
  const [managePassword, setManagePassword] = useState("");
  const [isManageSubmitting, setIsManageSubmitting] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logStreamItems, setLogStreamItems] = useState<LogStreamItem[]>([]);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [resultsStatusFilter, setResultsStatusFilter] = useState<
    "all" | ResultStatusTone
  >("all");
  const [resultsMachineFilter, setResultsMachineFilter] = useState("all");
  const [resultsCommandFilter, setResultsCommandFilter] = useState("all");
  const [resultsDateRange, setResultsDateRange] = useState<ResultDateRange>({
    from: "",
    to: "",
  });
  const [resultHistoryRows, setResultHistoryRows] = useState<
    ResultHistoryRow[]
  >([]);
  const [reportTasks, setReportTasks] = useState<ReportTaskItem[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("day");
  const [reportMachine, setReportMachine] = useState("all");
  const [reportTemplate, setReportTemplate] = useState("all");
  const [reportTeam, setReportTeam] = useState("all");
  const [isReportsRefreshing, setIsReportsRefreshing] = useState(false);
  const [profileDashboard, setProfileDashboard] =
    useState<ProfileDashboardResponse | null>(null);
  const [profileDetails, setProfileDetails] =
    useState<AccountProfileDetails | null>(null);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileDeletedRetention, setProfileDeletedRetention] =
    useState<DeletedMachineRetention>("month");
  const [profileSaveNotice, setProfileSaveNotice] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<
    Record<"tasks" | "warnings" | "reports" | "security", {
      topic: "tasks" | "warnings" | "reports" | "security";
      siteEnabled: boolean;
      telegramEnabled: boolean;
    }>
  >({
    tasks: { topic: "tasks", siteEnabled: true, telegramEnabled: false },
    warnings: { topic: "warnings", siteEnabled: true, telegramEnabled: true },
      reports: { topic: "reports", siteEnabled: true, telegramEnabled: false },
      security: { topic: "security", siteEnabled: true, telegramEnabled: true },
    });
  const [notificationFeed, setNotificationFeed] = useState<AccountNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsNotice, setNotificationsNotice] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [accountSessions, setAccountSessions] = useState<AccountSession[]>([]);
  const [sessionsNotice, setSessionsNotice] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isSessionRevoking, setIsSessionRevoking] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetupStart | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpNotice, setTotpNotice] = useState<string | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [isTotpLoading, setIsTotpLoading] = useState(false);
  const [telegramSetupState, setTelegramSetupState] = useState<{
    linkUrl?: string | null;
    reason?: string | null;
  } | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRead[]>([]);
  const [apiKeyMachineOptions, setApiKeyMachineOptions] = useState<AccountMachineScopeOption[]>([]);
  const [apiKeysNotice, setApiKeysNotice] = useState<string | null>(null);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [isApiKeySubmitting, setIsApiKeySubmitting] = useState(false);
  const [isApiKeyRevoking, setIsApiKeyRevoking] = useState(false);
  const [latestApiKeySecret, setLatestApiKeySecret] = useState<string | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState<{
    name: string;
    permission: ApiKeyPermission;
    expiryPreset: ApiKeyExpiryPreset;
    machineIds: string[];
    templateKeysText: string;
    reauthPassword: string;
  }>({
    name: "",
    permission: "read",
    expiryPreset: "month",
    machineIds: [],
    templateKeysText: "",
    reauthPassword: "",
  });
  const [taskFilterStatus, setTaskFilterStatus] =
    useState<TaskFilterStatus>("all");
  const [logFilterTone, setLogFilterTone] = useState<"all" | LogStatusTone>(
    "all",
  );
  const [logsAutoScrollEnabled, setLogsAutoScrollEnabled] = useState(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLinuxInstallGuideOpen, setIsLinuxInstallGuideOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [taskMachineId, setTaskMachineId] = useState("");
  const [taskCommand, setTaskCommand] = useState("");
  const [taskTemplateOptions, setTaskTemplateOptions] = useState<
    CommandTemplateOption[]
  >([]);
  const [taskParamValues, setTaskParamValues] = useState<Record<string, string>>(
    {},
  );
  const [taskUseSudo, setTaskUseSudo] = useState(false);
  const [addMachineCode, setAddMachineCode] = useState("");
  const [addMachineDisplayName, setAddMachineDisplayName] = useState("");
  const [isAddMachineSubmitting, setIsAddMachineSubmitting] = useState(false);
  const [addMachineError, setAddMachineError] = useState<string | null>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState(() => {
    try {
      return (
        window.localStorage.getItem("umirhack-last-registered-email") ?? ""
      );
    } catch {
      return "";
    }
  });
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualResetToken, setManualResetToken] = useState("");
  const resetTokenFromUrl = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() ?? "",
    [location.search],
  );
  const resolvedResetToken = resetTokenFromUrl || manualResetToken.trim();

  const setScreen = (nextScreen: AppScreen) => {
    if (nextScreen === "auth") {
      navigate("/login");
      return;
    }

    navigate(workspacePath("machines"));
  };

  const setAuthMode = (nextMode: AuthMode) => {
    setAuthNotice(null);
    setAuthError(null);
    navigate(authPath(nextMode));
  };

  const setWorkspaceTab = (nextTab: WorkspaceTab) => {
    navigate(workspacePath(nextTab));
  };

  const setSelectedMachineId = (machineId: string | null) => {
    navigate(machineId ? machinePath(machineId) : workspacePath("machines"));
  };

  const openMachine = (
    machineId: string,
    tab: "dashboard" | "tasks" | "results" | "logs" = "dashboard",
  ) => {
    navigate(machinePath(machineId, tab));
  };

  const openTaskLogs = (taskId: string, machineId: string) => {
    if (workspaceTab === "machines" && selectedMachineId === machineId) {
      navigate(machineTaskLogsPath(machineId, taskId), {
        state: { returnTo: machinePath(machineId) },
      });
      return;
    }

    navigate(taskLogsPath(taskId), {
      state: { returnTo: `${location.pathname}${location.search}` },
    });
  };

  const openResultDetail = (resultId: string, machineId: string) => {
    if (workspaceTab === "machines" && selectedMachineId === machineId) {
      navigate(machineResultPath(machineId, resultId), {
        state: { returnTo: machinePath(machineId) },
      });
      return;
    }

    navigate(resultPath(resultId), {
      state: { returnTo: `${location.pathname}${location.search}` },
    });
  };

  const closeRouteModal = () => {
    if (route.section !== "workspace" || !route.modal) {
      return;
    }

    if (modalReturnTo) {
      navigate(modalReturnTo);
      return;
    }

    if (
      route.modal.kind === "machine-task-logs" ||
      route.modal.kind === "machine-result"
    ) {
      navigate(
        route.machineId ? machinePath(route.machineId) : workspacePath("machines"),
      );
      return;
    }

    if (route.modal.kind === "task-logs") {
      navigate(workspacePath("tasks"));
      return;
    }

    navigate(workspacePath("results"));
  };

  const profileDisplayName = useMemo(() => {
    if (!profileDashboard) return "Профиль";
    const trimmed = profileDashboard.fullName.trim();
    return trimmed || profileDashboard.email || "Профиль";
  }, [profileDashboard]);

  const effectiveProfileDisplayName = useMemo(() => {
    const candidate = profileDetails?.fullName || profileDetails?.email || profileDisplayName;
    const trimmed = candidate.trim();
    return trimmed || "Профиль";
  }, [profileDetails, profileDisplayName]);

  const activeProfileSection: ProfileSectionKey =
    route.section === "workspace" && route.workspaceTab === "profile"
      ? route.profileSection ?? "general"
      : "general";

  const passwordIssues = useMemo(
    () =>
      passwordForm.newPassword
        ? validatePasswordPolicy(passwordForm.newPassword)
        : [],
    [passwordForm.newPassword],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const profile = await bootstrapAuthSession();
        if (cancelled) return;

        setProfileDashboard(profile);
        setSessionReady(true);

        if (profile && route.section === "auth" && route.authMode !== "confirm") {
          navigate(workspacePath("machines"), { replace: true });
          return;
        }

        if (!profile && route.section === "workspace") {
          navigate("/login", { replace: true });
        }
      } catch {
        if (cancelled) return;
        setProfileDashboard(null);
        setSessionReady(true);
        if (route.section === "workspace") {
          navigate("/login", { replace: true });
        }
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [navigate, route.section, route.section === "auth" ? route.authMode : ""]);

  useEffect(() => {
    applyThemeMode(themeMode, document.documentElement);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!profileDashboard) return;
    setProfileFirstName(profileDashboard.firstName);
    setProfileLastName(profileDashboard.lastName);
  }, [profileDashboard]);

  useEffect(() => {
    if (!profileDetails) return;
    setProfileFirstName(profileDetails.firstName);
    setProfileLastName(profileDetails.lastName);
    setProfileDeletedRetention(profileDetails.deletedMachineRetention);
    setProfileAvatarUrl(profileDetails.avatarDataUrl ?? null);
  }, [profileDetails]);

  useEffect(() => {
    if (!profileDashboard) {
      setNotificationFeed([]);
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;
    setIsNotificationsLoading(true);

    accountApi
      .listNotifications()
      .then((response) => {
        if (cancelled) return;
        setNotificationFeed(response.items);
        setUnreadNotificationCount(response.unreadCount);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (cancelled) return;
        setIsNotificationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileDashboard]);

  useEffect(() => {
    if (workspaceTab !== "profile" || !profileDashboard) {
      return;
    }

    let cancelled = false;
    setIsSessionsLoading(true);
    setIsApiKeysLoading(true);
    setIsNotificationsLoading(true);

    Promise.all([
      accountApi.getProfileDetails(),
      accountApi.listSessions(),
      accountApi.getNotificationPreferences(),
      accountApi.listNotifications(),
      accountApi.listApiKeys(),
      accountApi.listMachineScopeOptions(),
    ])
      .then(
        ([profile, sessions, preferences, notifications, apiKeyItems, machineOptions]) => {
          if (cancelled) return;
          setProfileDetails(profile);
          setProfileDashboard((current) =>
            current
              ? {
                  ...current,
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  fullName: profile.fullName,
                }
              : current,
          );
          setAccountSessions(sessions);
          setNotificationPreferences(preferences);
          setNotificationFeed(notifications.items);
          setUnreadNotificationCount(notifications.unreadCount);
          setApiKeys(apiKeyItems);
          setApiKeyMachineOptions(machineOptions);
        },
      )
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (cancelled) return;
        setIsSessionsLoading(false);
        setIsApiKeysLoading(false);
        setIsNotificationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileDashboard, workspaceTab]);

  useEffect(() => {
    setWorkspaceSearchQuery("");
  }, [workspaceTab, selectedMachineId]);

  useEffect(() => {
    if (isAddMachineRoute) {
      return;
    }

    setAddMachineError(null);
    setIsAddMachineSubmitting(false);
  }, [isAddMachineRoute]);

  useEffect(() => {
    if (!machineDashboardCards.length) {
      setTaskMachineId("");
      return;
    }

    if (
      taskMachineId &&
      machineDashboardCards.some((machine) => machine.id === taskMachineId)
    ) {
      return;
    }

    if (
      selectedMachineId &&
      machineDashboardCards.some((machine) => machine.id === selectedMachineId)
    ) {
      setTaskMachineId(selectedMachineId);
      return;
    }

    setTaskMachineId(machineDashboardCards[0]?.id ?? "");
  }, [machineDashboardCards, selectedMachineId, taskMachineId]);

  useEffect(() => {
    if (!taskMachineId) {
      setTaskTemplateOptions([]);
      setTaskCommand("");
      setTaskParamValues({});
      setTaskUseSudo(false);
      return;
    }

    let cancelled = false;
    apiClient
      .getMachineCommandTemplates(taskMachineId)
      .then((templates) => {
        if (cancelled) return;
        setTaskTemplateOptions(templates);
        const fallbackTemplateKey = templates[0]?.templateKey ?? "";
        setTaskCommand((current) =>
          current && templates.some((template) => template.templateKey === current)
            ? current
            : fallbackTemplateKey,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setTaskTemplateOptions([]);
        setTaskCommand("");
      });

    return () => {
      cancelled = true;
    };
  }, [taskMachineId]);

  useEffect(() => {
    setTaskParamValues((current) => {
      if (!taskCommand) return {};

      const template = taskTemplateOptions.find(
        (option) => option.templateKey === taskCommand,
      );
      if (!template) return {};

      const nextValues = template.parameters.reduce<Record<string, string>>(
        (acc, parameter) => {
          const preserved = current[parameter.key];
          acc[parameter.key] =
            preserved && parameter.allowedValues.includes(preserved)
              ? preserved
              : parameter.allowedValues[0] ?? "";
          return acc;
        },
        {},
      );

      return nextValues;
    });
  }, [taskCommand, taskTemplateOptions]);

  const visibleLogEntries = useMemo(() => {
    const byTone =
      logFilterTone === "all"
        ? logEntries
        : logEntries.filter((entry) => entry.tone === logFilterTone);

    return byTone.filter((entry) =>
      (logContext.machineId ? entry.machineId === logContext.machineId : true) &&
      (logContext.taskId ? entry.taskId === logContext.taskId : true) &&
      matchesSearchQuery(workspaceSearchQuery, [
        entry.taskTitle,
        entry.machine,
        entry.action,
        entry.email,
        entry.status,
      ]),
    );
  }, [logContext.machineId, logContext.taskId, logEntries, logFilterTone, workspaceSearchQuery]);

  const visibleLogStreamItems = useMemo(
    () =>
      logStreamItems.filter(
        (item) =>
          (logContext.machineId ? item.machineId === logContext.machineId : true) &&
          (logContext.taskId ? item.taskId === logContext.taskId : true) &&
          matchesSearchQuery(workspaceSearchQuery, [
            item.title,
            item.machine,
            item.text,
          ]),
      ),
    [logContext.machineId, logContext.taskId, logStreamItems, workspaceSearchQuery],
  );

  const logScopeSummary = useMemo(() => {
    const machineName =
      (logContext.machineId
        ? machineDashboardCards.find((machine) => machine.id === logContext.machineId)
            ?.machine ?? visibleLogEntries[0]?.machine ?? null
        : null) ?? null;
    const taskTitle =
      (logContext.taskId
        ? visibleLogEntries.find((entry) => entry.taskId === logContext.taskId)
            ?.taskTitle ??
          visibleLogStreamItems.find((item) => item.taskId === logContext.taskId)
            ?.title ??
          null
        : null) ?? null;

    return buildLogsScopeSummary({
      machine: machineName,
      taskTitle,
    });
  }, [
    logContext.machineId,
    logContext.taskId,
    machineDashboardCards,
    visibleLogEntries,
    visibleLogStreamItems,
  ]);

  const logStatusStats = useMemo(
    () => ({
      success: logEntries.filter((entry) => entry.tone === "success").length,
      warning: logEntries.filter((entry) => entry.tone === "warning").length,
      critical: logEntries.filter((entry) => entry.tone === "critical").length,
    }),
    [logEntries],
  );

  const reportMachineOptions = useMemo(
    () =>
      machineDashboardCards.map((machine) => ({
        id: machine.id,
        label: machine.machine,
      })),
    [machineDashboardCards],
  );

  const reportTemplateOptions = useMemo(
    () =>
      [...new Set(reportTasks.map((task) => task.templateName))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ru")),
    [reportTasks],
  );

  const reportTeamOptions = useMemo(
    () =>
      [...new Set(reportTasks.map((task) => task.requestedBy))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ru")),
    [reportTasks],
  );

  const reportBaseFilteredTasks = useMemo(
    () =>
      reportTasks.filter((task) => {
        const byMachine =
          reportMachine === "all" || task.machineId === reportMachine;
        const byTemplate =
          reportTemplate === "all" || task.templateName === reportTemplate;
        const byTeam = reportTeam === "all" || task.requestedBy === reportTeam;

        return byMachine && byTemplate && byTeam;
      }),
    [reportMachine, reportTasks, reportTeam, reportTemplate],
  );

  const filteredReportTasks = useMemo(() => {
    if (reportPeriod === "all") {
      return reportBaseFilteredTasks;
    }

    const now = Date.now();
    const windowMs = REPORT_PERIOD_WINDOW_MS[reportPeriod];
    return reportBaseFilteredTasks.filter((task) => {
      const taskTime = new Date(task.createdAtIso).getTime();
      return !Number.isNaN(taskTime) && now - taskTime <= windowMs;
    });
  }, [reportBaseFilteredTasks, reportPeriod]);

  const reportComparison = useMemo(() => {
    if (reportPeriod === "all") {
      return null;
    }

    const now = Date.now();
    const windowMs = REPORT_PERIOD_WINDOW_MS[reportPeriod];
    const currentStart = now - windowMs;
    const previousStart = currentStart - windowMs;

    const currentTasks: ReportTaskItem[] = [];
    const previousTasks: ReportTaskItem[] = [];

    for (const task of reportBaseFilteredTasks) {
      const taskTime = new Date(task.createdAtIso).getTime();
      if (Number.isNaN(taskTime)) {
        continue;
      }

      if (taskTime >= currentStart && taskTime <= now) {
        currentTasks.push(task);
      } else if (taskTime >= previousStart && taskTime < currentStart) {
        previousTasks.push(task);
      }
    }

    return {
      current: getReportComparisonStats(currentTasks),
      previous: getReportComparisonStats(previousTasks),
    };
  }, [reportBaseFilteredTasks, reportPeriod]);

  const reportSummaryRows = useMemo(() => {
    const groupedRows = new Map<
      string,
      {
        title: string;
        totalTasks: number;
        successCount: number;
        errorCount: number;
        durationTotalMs: number;
        durationCount: number;
      }
    >();

    for (const task of filteredReportTasks) {
      const bucket = groupedRows.get(task.templateName) ?? {
        title: task.templateName,
        totalTasks: 0,
        successCount: 0,
        errorCount: 0,
        durationTotalMs: 0,
        durationCount: 0,
      };

      bucket.totalTasks += 1;
      if (task.status === "completed") {
        bucket.successCount += 1;
      }
      if (task.status === "error") {
        bucket.errorCount += 1;
      }
      if (typeof task.durationMs === "number" && task.durationMs > 0) {
        bucket.durationTotalMs += task.durationMs;
        bucket.durationCount += 1;
      }

      groupedRows.set(task.templateName, bucket);
    }

    return [...groupedRows.entries()]
      .map(
        ([key, value]): ReportSummaryRow => ({
          id: key,
          title: value.title,
          totalTasks: value.totalTasks,
          successCount: value.successCount,
          errorCount: value.errorCount,
          avgDurationMs:
            value.durationCount > 0
              ? value.durationTotalMs / value.durationCount
              : undefined,
          actionLabel:
            value.errorCount > 0 ? "Смотреть логи" : "Перейти к задачам",
        }),
      )
      .filter((row) => matchesSearchQuery(workspaceSearchQuery, [row.title]))
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }, [filteredReportTasks, workspaceSearchQuery]);

  const reportStats = useMemo(() => {
    const durations = filteredReportTasks
      .map((task) => task.durationMs)
      .filter(
        (value): value is number => typeof value === "number" && value > 0,
      );
    const averageDurationMs = durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length
      : 0;

    const completedTasks = filteredReportTasks.filter(
      (task) => task.status === "completed",
    ).length;
    const errorTasks = filteredReportTasks.filter(
      (task) => task.status === "error",
    ).length;
    const finishedTasks = completedTasks + errorTasks;
    const successRate = finishedTasks
      ? (completedTasks / finishedTasks) * 100
      : 100;

    const scopedMachines =
      reportMachine === "all"
        ? machineDashboardCards
        : machineDashboardCards.filter(
            (machine) => machine.id === reportMachine,
          );
    const activeMachines = scopedMachines.filter(
      (machine) => machine.status === "online" || machine.status === "running",
    ).length;

    return {
      averageDurationMs,
      activeMachines,
      totalMachines: scopedMachines.length,
      errorTasks,
      totalTasks: filteredReportTasks.length,
      successRate,
      completedTasks,
      finishedTasks,
    };
  }, [filteredReportTasks, machineDashboardCards, reportMachine]);

  const reportTrend = useMemo(() => {
    const periodLabel =
      reportPeriod === "day"
        ? "за сутки"
        : reportPeriod === "week"
          ? "за неделю"
          : reportPeriod === "month"
            ? "за месяц"
            : "за период";

    const fallback = {
      duration: `Динамика ${periodLabel}`,
      machines: "Отслеживание по выбранной выборке",
      errors: "Сравнение с предыдущим периодом",
      success: "Сравнение с предыдущим периодом",
    };

    if (!reportComparison) {
      return fallback;
    }

    const durationDiffSec = Math.round(
      (reportComparison.current.averageDurationMs -
        reportComparison.previous.averageDurationMs) /
        1000,
    );
    const machinesDiff =
      reportComparison.current.activeMachines -
      reportComparison.previous.activeMachines;
    const errorsDiff =
      reportComparison.current.errorTasks -
      reportComparison.previous.errorTasks;
    const successDiff =
      reportComparison.current.successRate -
      reportComparison.previous.successRate;

    const durationText =
      durationDiffSec === 0
        ? `Без изменений ${periodLabel}`
        : `${durationDiffSec > 0 ? "Выше" : "Ниже"} на ${Math.abs(durationDiffSec)} с ${periodLabel}`;
    const machinesText =
      machinesDiff === 0
        ? "Количество активных машин без изменений"
        : `На ${Math.abs(machinesDiff)} ${machinesDiff > 0 ? "больше" : "меньше"} активных машин, чем в прошлом периоде`;
    const errorsText =
      errorsDiff === 0
        ? "Ошибки без изменений"
        : `На ${Math.abs(errorsDiff)} ${errorsDiff > 0 ? "больше" : "меньше"} ошибок, чем раньше`;
    const successText =
      Math.abs(successDiff) < 0.05
        ? "Процент успеха стабилен"
        : `${successDiff > 0 ? "Выше" : "Ниже"} на ${Math.abs(successDiff).toFixed(1)}% относительно прошлого периода`;

    return {
      duration: durationText,
      machines: machinesText,
      errors: errorsText,
      success: successText,
    };
  }, [reportComparison, reportPeriod]);

  const machineStatusGroups = useMemo(
    () =>
      machineStatusSections.map((section) => ({
        ...section,
        cards: machineDashboardCards.filter(
          (card) =>
            card.status === section.key &&
            matchesSearchQuery(workspaceSearchQuery, [
              card.machine,
              card.hostname,
              card.os,
              card.owner,
              card.heartbeat,
              machineStatusLabelByStatus[card.status],
            ]),
        ),
      })),
    [machineDashboardCards, workspaceSearchQuery],
  );

  const taskStatusGroups = useMemo(
    () =>
      buildTaskSections(taskCards).map((section) => ({
        ...section,
        cards: section.cards.filter((task) =>
          matchesSearchQuery(workspaceSearchQuery, [
            task.taskNumber,
            task.title,
            task.machine,
            task.serverNumber,
            task.resultText,
          ]),
        ),
      })),
    [taskCards, workspaceSearchQuery],
  );

  const visibleTaskStatusGroups = useMemo(
    () =>
      taskFilterStatus === "all"
        ? taskStatusGroups
        : taskStatusGroups.filter(
            (section) => section.key === taskFilterStatus,
          ),
    [taskFilterStatus, taskStatusGroups],
  );

  const selectedMachine = useMemo(
    () =>
      machineDashboardCards.find((card) => card.id === selectedMachineId) ??
      null,
    [machineDashboardCards, selectedMachineId],
  );

  const visibleHomeActionCards = useMemo(
    () =>
      homeActionCards.filter((card) =>
        matchesSearchQuery(workspaceSearchQuery, [card.label]),
      ),
    [homeActionCards, workspaceSearchQuery],
  );

  const visibleHomeTaskRows = useMemo(
    () =>
      homeTaskRows.filter((row) =>
        matchesSearchQuery(workspaceSearchQuery, [
          row.id,
          row.machine,
          row.status,
          row.createdAt,
          row.sender,
        ]),
      ),
    [homeTaskRows, workspaceSearchQuery],
  );

  const selectedMachineTaskCards = useMemo(
    () =>
      selectedMachine
        ? taskCards.filter(
            (task) =>
              task.machineId === selectedMachine.id &&
              matchesSearchQuery(workspaceSearchQuery, [
                task.taskNumber,
                task.title,
                task.machine,
                task.resultText,
              ]),
          )
        : [],
    [selectedMachine, taskCards, workspaceSearchQuery],
  );

  const selectedMachineResultRows = useMemo(
    () =>
      selectedMachine
        ? resultHistoryRows.filter(
            (row) =>
              row.machineId === selectedMachine.id &&
              matchesSearchQuery(workspaceSearchQuery, [
                row.title,
                row.statusLabel,
                row.machine,
                row.command,
                row.resultAt,
              ]),
          )
        : [],
    [resultHistoryRows, selectedMachine, workspaceSearchQuery],
  );

  const selectedMachineLogEntries = useMemo(
    () =>
      selectedMachine
        ? visibleLogEntries.filter((entry) => entry.machineId === selectedMachine.id)
        : [],
    [selectedMachine, visibleLogEntries],
  );

  const selectedTaskTemplate = useMemo(
    () =>
      taskTemplateOptions.find((template) => template.templateKey === taskCommand) ??
      null,
    [taskCommand, taskTemplateOptions],
  );

  const selectedTaskMachine = useMemo(
    () =>
      machineDashboardCards.find((machine) => machine.id === taskMachineId) ?? null,
    [machineDashboardCards, taskMachineId],
  );

  useEffect(() => {
    if (!/^linux\b/i.test(selectedTaskMachine?.os ?? "")) {
      setTaskUseSudo(false);
    }
  }, [selectedTaskMachine?.os]);

  const taskPreviewShellLabel = useMemo(
    () => getTaskPreviewShellLabel(selectedTaskMachine?.os ?? ""),
    [selectedTaskMachine?.os],
  );

  const taskPreviewCommand = useMemo(
    () =>
      selectedTaskTemplate
        ? buildTaskPreview({
            commandPattern: selectedTaskTemplate.commandPattern,
            params: taskParamValues,
            useSudo: taskUseSudo && /^linux\b/i.test(selectedTaskMachine?.os ?? ""),
          })
        : "",
    [selectedTaskMachine?.os, selectedTaskTemplate, taskParamValues, taskUseSudo],
  );

  const selectedMachineCanCreateTask = useMemo(
    () =>
      selectedMachine
        ? selectedMachine.myRole === "Владелец" ||
          selectedMachine.myRole === "Администратор" ||
          selectedMachine.myRole === "Оператор"
        : false,
    [selectedMachine],
  );

  const canSubmitTask =
    Boolean(taskMachineId) &&
    Boolean(taskCommand) &&
    Boolean(taskPreviewCommand);

  const visibleAccessRows = useMemo(
    () =>
      accessUserRows
        .filter((row) =>
          matchesSearchQuery(workspaceSearchQuery, [
            row.email,
            row.role,
            row.resource,
            row.status,
            row.action,
          ]),
        )
        .slice(0, ACCESS_ROWS_LIMIT),
    [accessUserRows, workspaceSearchQuery],
  );

  const visibleAccessInvites = useMemo(
    () =>
      accessInviteRows
        .filter((row) =>
          matchesSearchQuery(workspaceSearchQuery, [
            row.email,
            row.role,
            row.resource,
            row.status,
          ]),
        )
        .slice(0, ACCESS_ROWS_LIMIT),
    [accessInviteRows, workspaceSearchQuery],
  );

  const selectedInviteMachine = useMemo(
    () =>
      accessMachines.find((machine) => machine.id === inviteMachineId) ??
      accessMachines[0] ??
      null,
    [accessMachines, inviteMachineId],
  );

  const inviteMachineOptions = useMemo(
    () =>
      accessMachines.map((machine) => ({
        value: machine.id,
        label: `${machine.resource} • ${machine.role}`,
      })),
    [accessMachines],
  );

  const inviteRoleOptions = useMemo(
    () =>
      (selectedInviteMachine?.availableRoleValues ?? []).map((role) => ({
        value: role,
        label:
          role === "admin"
            ? "Администратор"
            : role === "operator"
              ? "Оператор"
              : "Наблюдатель",
      })),
    [selectedInviteMachine],
  );

  const selectedManageRow = useMemo(
    () =>
      accessUserRows.find((row) => row.id === manageAccessRowId) ?? null,
    [accessUserRows, manageAccessRowId],
  );

  const manageRoleOptions = useMemo(
    () =>
      (selectedManageRow?.availableRoleValues ?? []).map((role) => ({
        value: role,
        label:
          role === "admin"
            ? "Администратор"
            : role === "operator"
              ? "Оператор"
              : "Наблюдатель",
      })),
    [selectedManageRow],
  );

  const resultsFilterOptions = useMemo(
    () => buildResultsFilterOptions(resultHistoryRows),
    [resultHistoryRows],
  );
  const resultsMachineOptions = useMemo(
    () =>
      resultsFilterOptions.machineOptions
        .filter((option) => option.value !== "all")
        .map((option) => option.value),
    [resultsFilterOptions],
  );
  const resultsCommandOptions = useMemo(
    () =>
      resultsFilterOptions.commandOptions
        .filter((option) => option.value !== "all")
        .map((option) => option.value),
    [resultsFilterOptions],
  );
  const resultsDateFilter = "all";
  const setResultsDateFilter = (_value: string) => {};

  const visibleResultRows = useMemo(() => {
    return filterResultRows(resultHistoryRows, {
      status: resultsStatusFilter,
      machine: resultsMachineFilter,
      command: resultsCommandFilter,
      searchQuery: workspaceSearchQuery,
      dateRange: resultsDateRange,
    });
  }, [
    resultsCommandFilter,
    resultsDateRange,
    resultsMachineFilter,
    resultHistoryRows,
    resultsStatusFilter,
    workspaceSearchQuery,
  ]);

  useEffect(() => {
    if (!sessionReady || screen !== "machines") return;

    const loadMachines = async () => {
      const machines = await apiClient.getMachines();
      setMachineDashboardCards(machines);
    };

    const loadHome = async () => {
      const dashboard = await apiClient.getHomeDashboard();
      setHomeMetricCards(dashboard.metrics);
      setHomeActionCards(dashboard.actions);
      setHomeErrorItems(dashboard.errors);
      setHomeTaskRows(dashboard.tasks);
    };

    const loadTasks = async () => {
      if (workspaceTab === "tasks" || selectedMachineId) {
        const tasks = await apiClient.getTasks();
        setTaskCards(tasks);
      }
    };

    const loadAccessDashboard = async () => {
      if (workspaceTab !== "access") return;

      await refreshAccessDashboard();
    };

    const loadLogsDashboard = async () => {
      if (workspaceTab !== "logs" && !selectedMachineId) return;

      const logsDashboard = await apiClient.getLogsDashboard();
      setLogEntries(logsDashboard.entries);
      setLogStreamItems(logsDashboard.streamItems);
    };

    const loadReportsDashboard = async () => {
      if (workspaceTab !== "reports") return;

      const reportsDashboard = await apiClient.getReportsDashboard();
      setReportTasks(reportsDashboard.tasks);
    };

    const loadResultsDashboard = async () => {
      if (workspaceTab !== "results" && !selectedMachineId) return;

      const resultsDashboard = await apiClient.getResultsDashboard();
      setResultHistoryRows(resultsDashboard.rows);
    };

    loadMachines().catch(() => setMachineDashboardCards([]));
    loadHome().catch(() => {
      setHomeMetricCards([]);
      setHomeActionCards([]);
      setHomeErrorItems([]);
      setHomeTaskRows([]);
    });
    loadTasks().catch(() => setTaskCards([]));
    loadAccessDashboard().catch(() => {
      setAccessSummaryCards([]);
      setAccessMachines([]);
      setAccessUserRows([]);
      setAccessInviteRows([]);
      setAccessActivityItems([]);
    });
    loadLogsDashboard().catch(() => {
      setLogEntries([]);
      setLogStreamItems([]);
    });
    loadReportsDashboard().catch(() => {
      setReportTasks([]);
    });
    loadResultsDashboard().catch(() => {
      setResultHistoryRows([]);
    });
  }, [screen, selectedMachineId, sessionReady, workspaceTab]);

  useEffect(() => {
    if (!sessionReady || screen !== "machines") return;

    let cancelled = false;

    const refreshMachineSnapshots = async () => {
      try {
        const machines = await apiClient.getMachines();
        if (cancelled) return;
        setMachineDashboardCards(machines);

        if (workspaceTab === "home") {
          const dashboard = await apiClient.getHomeDashboard();
          if (cancelled) return;
          setHomeMetricCards(dashboard.metrics);
          setHomeActionCards(dashboard.actions);
          setHomeErrorItems(dashboard.errors);
          setHomeTaskRows(dashboard.tasks);
        }
      } catch {
        if (cancelled) return;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshMachineSnapshots();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [screen, sessionReady, workspaceTab]);

  useEffect(() => {
    if (!isCreateTaskOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateTaskOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCreateTaskOpen]);

  useEffect(() => {
    if (!accessMachines.length) return;
    if (accessMachines.some((machine) => machine.id === inviteMachineId)) return;

    setInviteMachineId(accessMachines[0].id);
    setInviteRole(accessMachines[0].availableRoleValues[0] ?? "viewer");
  }, [accessMachines, inviteMachineId]);

  const openCreateTaskModal = () => {
    if (selectedMachineId) {
      setTaskMachineId(selectedMachineId);
    }
    setIsCreateTaskOpen(true);
  };

  const handleHomeActionClick = (label: string) => {
    const normalized = label.trim().toLowerCase();

    if (normalized.includes("создать задачу")) {
      openCreateTaskModal();
      return;
    }

    if (normalized.includes("открыть логи")) {
      navigate(logsPath());
      return;
    }

    if (normalized.includes("добавить агента")) {
      navigate(addMachinePath());
      return;
    }

    if (normalized.includes("управление")) {
      navigate(workspacePath("access"));
    }
  };

  const handleReportsRefresh = async () => {
    setIsReportsRefreshing(true);

    try {
      const reportsDashboard = await apiClient.getReportsDashboard();
      setReportTasks(reportsDashboard.tasks);
    } catch {
      setReportTasks([]);
    } finally {
      setIsReportsRefreshing(false);
    }
  };

  const closeCreateTaskModal = () => {
    setIsCreateTaskOpen(false);
  };

  const closeLinuxInstallGuide = () => {
    setIsLinuxInstallGuideOpen(false);
  };

  const copyLinuxGuideCommands = (commands: string[]) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    void navigator.clipboard.writeText(commands.join("\n"));
  };

  const copyTaskPreview = () => {
    if (!taskPreviewCommand) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    void navigator.clipboard.writeText(taskPreviewCommand);
  };

  const copyAddMachineCommand = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    void navigator.clipboard.writeText(AGENT_PAIR_COMMAND);
  };

  const resetAddMachineForm = () => {
    setAddMachineCode("");
    setAddMachineDisplayName("");
    setAddMachineError(null);
  };

  const resetTaskComposer = () => {
    setTaskCommand(taskTemplateOptions[0]?.templateKey ?? "");
    setTaskParamValues({});
    setTaskUseSudo(false);
  };

  const handleProfileAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  };

  const handleCreateTaskSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!taskMachineId || !taskCommand) {
      return;
    }

    try {
      await apiClient.createTask({
        machineId: taskMachineId,
        templateKey: taskCommand,
        params: taskParamValues,
      });
      setTaskParamValues({});
      closeCreateTaskModal();
      await refreshTaskLinkedViews();
    } catch {
      return;
    }
  };

  const handleAddMachineSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!addMachineCode.trim()) {
      setAddMachineError("Введите device code.");
      return;
    }

    setIsAddMachineSubmitting(true);
    setAddMachineError(null);

    try {
      const machine = await apiClient.confirmMachineRegistration({
        deviceCode: addMachineCode,
        displayName: addMachineDisplayName.trim() || undefined,
      });
      resetAddMachineForm();
      const machines = await apiClient.getMachines();
      setMachineDashboardCards(machines);
      navigate(machinePath(machine.id));
    } catch (error) {
      setAddMachineError(
        extractApiErrorMessage(error, "Не удалось подтвердить device code."),
      );
    } finally {
      setIsAddMachineSubmitting(false);
    }
  };

  const refreshTaskLinkedViews = async () => {
    const [tasks, resultsDashboard, logsDashboard] = await Promise.all([
      apiClient.getTasks(),
      apiClient.getResultsDashboard(),
      apiClient.getLogsDashboard(),
    ]);

    setTaskCards(tasks);
    setResultHistoryRows(resultsDashboard.rows);
    setLogEntries(logsDashboard.entries);
    setLogStreamItems(logsDashboard.streamItems);
  };

  const extractApiErrorMessage = (
    error: unknown,
    fallback: string,
  ): string => {
    if (!(error instanceof ApiError)) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(error.body) as {
        detail?: { message?: string } | string;
      };
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail;
      }
      if (
        parsed.detail &&
        typeof parsed.detail === "object" &&
        typeof parsed.detail.message === "string" &&
        parsed.detail.message.trim()
      ) {
        return parsed.detail.message;
      }
    } catch {
      if (error.body.trim()) {
        return error.body;
      }
    }

    return fallback;
  };

  const refreshAccessDashboard = async () => {
    const dashboard = await apiClient.getAccessDashboard();
    setAccessSummaryCards(dashboard.metrics);
    setAccessMachines(dashboard.machines);
    setAccessUserRows(dashboard.users);
    setAccessInviteRows(dashboard.invites);
    setAccessActivityItems(dashboard.activity);
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInvitePassword("");
    setAccessError(null);
  };

  const openInviteModal = () => {
    const initialMachine =
      selectedInviteMachine ?? accessMachines[0] ?? null;
    if (!initialMachine) return;

    setInviteMachineId(initialMachine.id);
    setInviteRole(initialMachine.availableRoleValues[0] ?? "viewer");
    setInviteEmail("");
    setInvitePassword("");
    setAccessError(null);
    setIsInviteModalOpen(true);
  };

  const openManageAccessModal = (row: AccessUserRow) => {
    if (!row.canManage || row.availableRoleValues.length === 0) return;

    const nextRole =
      row.availableRoleValues.find((role) => role === row.roleValue) ??
      row.availableRoleValues[0];
    setManageAccessRowId(row.id);
    setManageRole(nextRole);
    setManagePassword("");
    setAccessError(null);
  };

  const closeManageAccessModal = () => {
    setManageAccessRowId(null);
    setManagePassword("");
    setAccessError(null);
  };

  const handleInviteMachineChange = (value: string) => {
    setInviteMachineId(value);
    const machine = accessMachines.find((item) => item.id === value);
    if (machine?.availableRoleValues.length) {
      setInviteRole(machine.availableRoleValues[0]);
    }
  };

  const handleCreateInviteSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!inviteMachineId || !inviteEmail.trim() || !invitePassword) {
      return;
    }

    setIsInviteSubmitting(true);
    setAccessError(null);
    setAccessNotice(null);
    try {
      const reauthToken = await apiClient.reauth(invitePassword);
      await apiClient.createMachineInvite({
        machineId: inviteMachineId,
        email: inviteEmail.trim(),
        role: inviteRole,
        reauthToken,
      });
      await refreshAccessDashboard();
      closeInviteModal();
      setAccessNotice("Приглашение отправлено.");
    } catch (error) {
      setAccessError(
        extractApiErrorMessage(error, "Не удалось отправить приглашение."),
      );
    } finally {
      setIsInviteSubmitting(false);
    }
  };

  const handleManageAccessSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedManageRow || !managePassword) {
      return;
    }

    setIsManageSubmitting(true);
    setAccessError(null);
    setAccessNotice(null);
    try {
      const reauthToken = await apiClient.reauth(managePassword);
      await apiClient.updateMachineAccessRole({
        machineId: selectedManageRow.machineId,
        accessId: selectedManageRow.accessId,
        role: manageRole,
        reauthToken,
      });
      await refreshAccessDashboard();
      closeManageAccessModal();
      setAccessNotice("Роль пользователя обновлена.");
    } catch (error) {
      setAccessError(
        extractApiErrorMessage(error, "Не удалось изменить роль доступа."),
      );
    } finally {
      setIsManageSubmitting(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedManageRow || !managePassword) {
      return;
    }

    setIsManageSubmitting(true);
    setAccessError(null);
    setAccessNotice(null);
    try {
      const reauthToken = await apiClient.reauth(managePassword);
      await apiClient.revokeMachineAccess({
        machineId: selectedManageRow.machineId,
        accessId: selectedManageRow.accessId,
        reauthToken,
      });
      await refreshAccessDashboard();
      closeManageAccessModal();
      setAccessNotice("Доступ пользователя отозван.");
    } catch (error) {
      setAccessError(
        extractApiErrorMessage(error, "Не удалось отозвать доступ."),
      );
    } finally {
      setIsManageSubmitting(false);
    }
  };

  const handleTaskSecondaryAction = async (task: TaskCard) => {
    try {
      if (task.status === "in_progress" || task.status === "queued") {
        await apiClient.cancelTask(task.id);
      } else {
        await apiClient.retryTask(task.id);
      }
      await refreshTaskLinkedViews();
    } catch {
      return;
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthNotice(null);
    setAuthError(null);

    if (authMode === "login") {
      try {
        const response = await apiClient.login(email, password);
        if (response.requiresConfirmation) {
          setAuthChallengeId(response.challengeId ?? null);
          setAuthMode("confirm");
          return;
        }
        setAuthChallengeId(null);
        setScreen("machines");
      } catch (error) {
        setAuthError(
          extractApiErrorMessage(error, "Не удалось выполнить вход."),
        );
        return;
      }
      return;
    }

    try {
      const normalizedEmail = email.trim();
      await apiClient.register(normalizedEmail, password);
      setAuthChallengeId(null);
      setRegisteredEmail(normalizedEmail);
      window.localStorage.setItem(
        "umirhack-last-registered-email",
        normalizedEmail,
      );
      setAuthMode("confirm");
      setAuthNotice("Письмо с кодом отправлено. Завершите подтверждение.");
    } catch (error) {
      setAuthError(
        extractApiErrorMessage(error, "Не удалось завершить регистрацию."),
      );
      return;
    }
  };

  const handleConfirmSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthNotice(null);
    setAuthError(null);

    try {
      const normalizedEmail = email.trim();
      await apiClient.confirm(
        normalizedEmail,
        verificationCode,
        authChallengeId ?? undefined,
      );
      if (normalizedEmail) {
        setRegisteredEmail(normalizedEmail);
        window.localStorage.setItem(
          "umirhack-last-registered-email",
          normalizedEmail,
        );
      }
      setAuthChallengeId(null);
      setScreen("machines");
    } catch (error) {
      setAuthError(
        extractApiErrorMessage(error, "Не удалось подтвердить вход."),
      );
      return;
    }
  };

  const handleForgotPasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthNotice(null);
    setAuthError(null);

    try {
      const response = await apiClient.forgotPassword(email.trim());
      setAuthNotice(response.message);
    } catch (error) {
      setAuthError(
        extractApiErrorMessage(error, "Не удалось отправить письмо для сброса."),
      );
      return;
    }
  };

  const handleResetPasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthNotice(null);
    setAuthError(null);

    if (!resolvedResetToken) {
      setAuthError("Введите токен для сброса пароля.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Подтверждение нового пароля не совпадает.");
      return;
    }

    const issues = validatePasswordPolicy(password);
    if (issues.length) {
      setAuthError(issues[0] ?? "Пароль не соответствует политике.");
      return;
    }

    try {
      const response = await apiClient.resetPassword(resolvedResetToken, password);
      setPassword("");
      setConfirmPassword("");
      setManualResetToken("");
      navigate(authPath("login"), { replace: true });
      setAuthNotice(response.message);
    } catch (error) {
      setAuthError(
        extractApiErrorMessage(error, "Не удалось обновить пароль."),
      );
      return;
    }
  };

  const workspaceSearchPlaceholder = selectedMachine
    ? `Поиск по ${getMachineDisplayName(selectedMachine)}`
    : workspaceTab === "home"
      ? "Поиск по главной"
      : workspaceTab === "machines"
        ? "Поиск по машинам"
        : workspaceTab === "tasks"
          ? "Поиск по задачам"
          : workspaceTab === "results"
            ? "Поиск по результатам"
            : workspaceTab === "logs"
              ? "Поиск по логам"
              : workspaceTab === "access"
                ? "Поиск по доступам"
                : workspaceTab === "reports"
                  ? "Поиск по отчётам"
                  : workspaceTab === "install"
                    ? "Поиск по установке"
                    : "Поиск по профилю";

  const sidebarActiveTop = SIDEBAR_ACTIVE_TOP_BY_TAB[workspaceTab];

  const sidebarItems = useMemo(
    () =>
      menuItems.map((item) => ({
        key: item.tab ?? item.label,
        label: item.label,
        iconSrc: item.iconSrc,
        isActive: item.tab === workspaceTab,
        onClick: () => {
          if (item.tab) {
            navigate(workspacePath(item.tab));
          }
        },
      })),
    [navigate, workspaceTab],
  );

  const globalSearchTargets = useMemo<SearchTarget[]>(() => {
    const targets: SearchTarget[] = menuItems.map((item) => ({
      id: `menu:${item.tab ?? item.label}`,
      kind: "menu",
      title: item.label,
      subtitle: "Раздел платформы",
      href: item.tab ? workspacePath(item.tab) : workspacePath("machines"),
      keywords: [item.tab ?? "workspace", "navigation"],
    }));

    for (const machine of machineDashboardCards) {
      targets.push({
        id: `machine:${machine.id}`,
        kind: "machine",
        title: getMachineDisplayName(machine),
        subtitle: `${machine.os} • ${machine.owner}`,
        href: machinePath(machine.id),
        keywords: [machine.hostname, machine.myRole, machine.status],
      });
    }

    for (const task of taskCards) {
      targets.push({
        id: `task:${task.id}`,
        kind: "task",
        title: task.title,
        subtitle: `${task.machine} • ${task.resultText}`,
        href: taskPath(task.id),
        keywords: [task.templateKey, task.taskNumber, task.serverNumber],
      });
    }

    for (const row of resultHistoryRows) {
      targets.push({
        id: `result:${row.id}`,
        kind: "result",
        title: row.title,
        subtitle: `${row.machine} • ${row.statusLabel}`,
        href: resultPath(row.id),
        keywords: [row.command, row.resultAt],
      });
    }

    targets.push({
      id: "menu:profile",
      kind: "menu",
      title: "Профиль",
      subtitle: effectiveProfileDisplayName,
      href: workspacePath("profile"),
      keywords: ["security", "sessions", "notifications"],
    });

    targets.push({
      id: "menu:install",
      kind: "menu",
      title: "Установка",
      subtitle: "Команды и загрузки для агентов",
      href: workspacePath("install"),
      keywords: ["linux", "windows", "predict pair"],
    });

    return targets;
  }, [effectiveProfileDisplayName, machineDashboardCards, resultHistoryRows, taskCards]);

  const globalSearchResults = useMemo(
    () => getSearchMatches(workspaceSearchQuery, globalSearchTargets),
    [globalSearchTargets, workspaceSearchQuery],
  );

  const handleSelectGlobalSearchResult = (result: SearchMatch) => {
    setWorkspaceSearchQuery("");
    navigate(result.href);
  };

  const navigateProfileSection = (section: ProfileSectionKey) => {
    navigate(profilePath(section));
  };

  const handleOpenNotificationsPage = () => {
    setIsNotificationsOpen(false);
    navigateProfileSection("notifications");
  };

  const handleOpenNotificationTarget = (href: string) => {
    setIsNotificationsOpen(false);
    navigate(href);
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await accountApi.markNotificationRead(notificationId);
      setNotificationFeed((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, siteRead: true } : item,
        ),
      );
      setUnreadNotificationCount((current) => Math.max(0, current - 1));
    } catch {
      // Ignore feed interaction errors and keep the list usable.
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await accountApi.markAllNotificationsRead();
      setNotificationFeed((current) =>
        current.map((item) => ({ ...item, siteRead: true })),
      );
      setUnreadNotificationCount(0);
    } catch {
      // Ignore feed interaction errors and keep the list usable.
    }
  };

  const handleProfileSave = async () => {
    if (!profileDetails) return;

    setProfileSaveNotice(null);
    setProfileSaveError(null);
    setIsProfileSaving(true);

    try {
      const nextProfile = await accountApi.updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        avatarDataUrl: profileAvatarUrl,
        deletedMachineRetention: profileDeletedRetention,
      });
      setProfileDetails(nextProfile);
      setProfileDashboard((current) =>
        current
          ? {
              ...current,
              firstName: nextProfile.firstName,
              lastName: nextProfile.lastName,
              fullName: nextProfile.fullName,
            }
          : current,
      );
      setProfileSaveNotice("Профиль сохранён.");
    } catch (error) {
      setProfileSaveError(
        error instanceof ApiError ? error.body : "Не удалось сохранить профиль.",
      );
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleNotificationToggle = (
    topic: "tasks" | "warnings" | "reports" | "security",
    channel: "siteEnabled" | "telegramEnabled",
    value: boolean,
  ) => {
    setNotificationPreferences((current) => ({
      ...current,
      [topic]: {
        ...current[topic],
        [channel]: value,
      },
    }));
  };

  const handleNotificationPreferencesSave = async () => {
    setNotificationsNotice(null);
    setNotificationsError(null);
    setIsNotificationsSaving(true);

    try {
      const nextPreferences = await accountApi.updateNotificationPreferences(
        notificationPreferences,
      );
      setNotificationPreferences(nextPreferences);
      setNotificationsNotice("Настройки уведомлений сохранены.");
    } catch (error) {
      setNotificationsError(
        error instanceof ApiError
          ? error.body
          : "Не удалось сохранить настройки уведомлений.",
      );
    } finally {
      setIsNotificationsSaving(false);
    }
  };

  const handleSessionRevoke = async (sessionId: string) => {
    setSessionsNotice(null);
    setSessionsError(null);
    setIsSessionRevoking(true);

    try {
      const result = await accountApi.revokeSession(sessionId);
      if (result.revokedCurrentSession) {
        setProfileDashboard(null);
        setProfileDetails(null);
        navigate("/login", { replace: true });
        return;
      }

      setAccountSessions((current) =>
        current.filter((session) => session.id !== sessionId),
      );
      setSessionsNotice(result.message);
    } catch (error) {
      setSessionsError(
        error instanceof ApiError ? error.body : "Не удалось завершить сессию.",
      );
    } finally {
      setIsSessionRevoking(false);
    }
  };

  const getReauthGrant = async () => {
    if (passwordForm.currentPassword.trim()) {
      return accountApi.reauth({ password: passwordForm.currentPassword.trim() });
    }
    if (totpCode.trim()) {
      return accountApi.reauth({ totpCode: totpCode.trim() });
    }
    throw new Error("Введите текущий пароль или код TOTP для подтверждения действия.");
  };

  const handlePasswordFieldChange = (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordNotice(null);
    setPasswordError(null);
    if (passwordIssues.length) {
      setPasswordError(passwordIssues[0] ?? "Пароль не соответствует политике.");
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const response = await accountApi.changePassword(passwordForm);
      setPasswordNotice(response.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(
        error instanceof ApiError ? error.body : "Не удалось изменить пароль.",
      );
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleTotpStart = async () => {
    if (!passwordForm.currentPassword.trim()) {
      setTotpError("Введите текущий пароль, чтобы подключить TOTP.");
      return;
    }

    setTotpNotice(null);
    setTotpError(null);
    setIsTotpLoading(true);
    try {
      const setup = await accountApi.startTotpSetup(passwordForm.currentPassword.trim());
      setTotpSetup(setup);
      setTotpNotice("Секрет создан. Подтвердите его кодом из приложения.");
    } catch (error) {
      setTotpError(
        error instanceof ApiError ? error.body : "Не удалось начать настройку TOTP.",
      );
    } finally {
      setIsTotpLoading(false);
    }
  };

  const handleTotpConfirm = async () => {
    setTotpNotice(null);
    setTotpError(null);
    setIsTotpLoading(true);
    try {
      const response = await accountApi.confirmTotpSetup(totpCode.trim());
      setTotpSetup(null);
      setTotpCode("");
      setTotpNotice(response.message);
      const profile = await accountApi.getProfileDetails();
      setProfileDetails(profile);
    } catch (error) {
      setTotpError(
        error instanceof ApiError ? error.body : "Не удалось подтвердить TOTP.",
      );
    } finally {
      setIsTotpLoading(false);
    }
  };

  const handleTotpDisable = async () => {
    if (!passwordForm.currentPassword.trim() || !totpCode.trim()) {
      setTotpError("Введите текущий пароль и действующий код TOTP.");
      return;
    }

    setTotpNotice(null);
    setTotpError(null);
    setIsTotpLoading(true);
    try {
      const response = await accountApi.disableTotp({
        password: passwordForm.currentPassword.trim(),
        code: totpCode.trim(),
      });
      setTotpCode("");
      setTotpSetup(null);
      setTotpNotice(response.message);
      const profile = await accountApi.getProfileDetails();
      setProfileDetails(profile);
    } catch (error) {
      setTotpError(
        error instanceof ApiError ? error.body : "Не удалось отключить TOTP.",
      );
    } finally {
      setIsTotpLoading(false);
    }
  };

  const handleTelegramLink = async () => {
    setTelegramNotice(null);
    setTelegramError(null);
    setIsTelegramLoading(true);
    try {
      const response = await accountApi.startTelegramLink();
      setTelegramSetupState({ linkUrl: response.linkUrl });
      setTelegramNotice("Откройте Telegram и завершите привязку.");
    } catch (error) {
      setTelegramError(
        error instanceof ApiError ? error.body : "Не удалось начать привязку Telegram.",
      );
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleTelegramEnable = async () => {
    setTelegramNotice(null);
    setTelegramError(null);
    setIsTelegramLoading(true);
    try {
      const setup = await accountApi.startTelegramTwoFactorSetup();
      if (!setup.linked) {
        setTelegramSetupState({
          linkUrl: setup.linkUrl ?? null,
          reason: setup.reason ?? "Сначала завершите привязку Telegram.",
        });
        return;
      }

      const grant = await getReauthGrant();
      const response = await accountApi.confirmTelegramTwoFactorSetup(grant.token);
      setTelegramNotice(response.message);
      const profile = await accountApi.getProfileDetails();
      setProfileDetails(profile);
    } catch (error) {
      setTelegramError(
        error instanceof ApiError ? error.body : (error as Error).message || "Не удалось включить Telegram 2FA.",
      );
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleTelegramDisable = async () => {
    setTelegramNotice(null);
    setTelegramError(null);
    setIsTelegramLoading(true);
    try {
      const grant = await getReauthGrant();
      const response = await accountApi.disableTelegramTwoFactor(grant.token);
      setTelegramNotice(response.message);
      const profile = await accountApi.getProfileDetails();
      setProfileDetails(profile);
    } catch (error) {
      setTelegramError(
        error instanceof ApiError ? error.body : (error as Error).message || "Не удалось отключить Telegram 2FA.",
      );
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleTelegramUnlink = async () => {
    setTelegramNotice(null);
    setTelegramError(null);
    setIsTelegramLoading(true);
    try {
      const grant = await getReauthGrant();
      await accountApi.unlinkTelegram(grant.token);
      setTelegramNotice("Telegram отвязан.");
      const profile = await accountApi.getProfileDetails();
      setProfileDetails(profile);
    } catch (error) {
      setTelegramError(
        error instanceof ApiError ? error.body : (error as Error).message || "Не удалось отвязать Telegram.",
      );
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleApiKeyFieldChange = (
    field: "name" | "permission" | "expiryPreset" | "templateKeysText" | "reauthPassword",
    value: string,
  ) => {
    setApiKeyForm((current) => ({
      ...current,
      [field]:
        field === "permission"
          ? (value as ApiKeyPermission)
          : field === "expiryPreset"
            ? (value as ApiKeyExpiryPreset)
            : value,
    }));
  };

  const handleApiKeyMachineToggle = (machineId: string) => {
    setApiKeyForm((current) => ({
      ...current,
      machineIds: current.machineIds.includes(machineId)
        ? current.machineIds.filter((id) => id !== machineId)
        : [...current.machineIds, machineId],
    }));
  };

  const handleApiKeyCreate = async () => {
    setApiKeysNotice(null);
    setApiKeysError(null);
    setLatestApiKeySecret(null);

    if (!apiKeyForm.machineIds.length) {
      setApiKeysError("Выберите хотя бы одну машину для API ключа.");
      return;
    }

    setIsApiKeySubmitting(true);
    try {
      const grant = await accountApi.reauth({
        password: apiKeyForm.reauthPassword.trim(),
      });
      const response = await accountApi.createApiKey({
        name: apiKeyForm.name.trim(),
        permission: apiKeyForm.permission,
        machineIds: apiKeyForm.machineIds,
        allowedTemplateKeys: apiKeyForm.templateKeysText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        expiryPreset: apiKeyForm.expiryPreset,
        reauthToken: grant.token,
      });
      setApiKeys((current) => [response.key, ...current]);
      setLatestApiKeySecret(response.rawKey);
      setApiKeysNotice("API ключ создан. Сохраните его сейчас.");
      setApiKeyForm({
        name: "",
        permission: "read",
        expiryPreset: "month",
        machineIds: [],
        templateKeysText: "",
        reauthPassword: "",
      });
    } catch (error) {
      setApiKeysError(
        error instanceof ApiError ? error.body : "Не удалось создать API ключ.",
      );
    } finally {
      setIsApiKeySubmitting(false);
    }
  };

  const handleApiKeyRevoke = async (keyId: string) => {
    if (!apiKeyForm.reauthPassword.trim()) {
      setApiKeysError("Введите пароль в форме API keys, чтобы отозвать ключ.");
      return;
    }

    setApiKeysNotice(null);
    setApiKeysError(null);
    setIsApiKeyRevoking(true);
    try {
      const grant = await accountApi.reauth({
        password: apiKeyForm.reauthPassword.trim(),
      });
      await accountApi.revokeApiKey(keyId, grant.token);
      setApiKeys((current) =>
        current.map((item) =>
          item.id === keyId
            ? { ...item, isActive: false, revokedAt: new Date().toISOString() }
            : item,
        ),
      );
      setApiKeysNotice("API ключ отозван.");
    } catch (error) {
      setApiKeysError(
        error instanceof ApiError ? error.body : "Не удалось отозвать API ключ.",
      );
    } finally {
      setIsApiKeyRevoking(false);
    }
  };

  const renderWorkspaceTopbar = () => (
    <Topbar
      searchQuery={workspaceSearchQuery}
      searchPlaceholder={workspaceSearchPlaceholder}
      searchResults={globalSearchResults}
      notificationItems={notificationFeed}
      unreadNotificationCount={unreadNotificationCount}
      notificationsOpen={isNotificationsOpen}
      themeMode={themeMode}
      onSearchChange={setWorkspaceSearchQuery}
      onSelectSearchResult={handleSelectGlobalSearchResult}
      onToggleNotifications={() => setIsNotificationsOpen((current) => !current)}
      onOpenNotificationsPage={handleOpenNotificationsPage}
      onOpenNotificationTarget={handleOpenNotificationTarget}
      onMarkNotificationRead={handleMarkNotificationRead}
      onToggleTheme={() =>
        setThemeMode((current) => (current === "dark" ? "light" : "dark"))
      }
      onCreateTask={openCreateTaskModal}
    />
  );

  if (!sessionReady) {
    return (
      <main className="auth-page" aria-label="Загрузка">
        <section className="auth-card auth-card--loading">
          <div className="auth-card__content auth-card__content--loading">
            <header className="brand-block">
              <p className="brand-block__name">PREDICT MV</p>
              <p className="brand-block__tagline">Загрузка рабочего пространства</p>
            </header>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "machines") {
    return (
      <main
        className="machines-page"
        aria-label={
          workspaceTab === "home"
            ? "Страница главная"
            : workspaceTab === "tasks"
              ? "Страница задач"
              : workspaceTab === "results"
                ? "Страница результатов"
                : workspaceTab === "logs"
                  ? "Страница логов"
                  : workspaceTab === "access"
                    ? "Страница доступа"
                    : workspaceTab === "reports"
                      ? "Страница отчётов"
                      : workspaceTab === "install"
                        ? "Страница установки"
                        : workspaceTab === "profile"
                          ? "Страница профиля"
                          : "Страница машин"
        }
      >
        <Sidebar
          activeStripTop={sidebarActiveTop}
          items={sidebarItems}
          profileLabel={effectiveProfileDisplayName}
          isProfileActive={workspaceTab === "profile"}
          isInstallActive={workspaceTab === "install"}
          onProfileClick={() => {
            navigate(profilePath());
          }}
          onInstallClick={() => {
            navigate(workspacePath("install"));
          }}
        />

        <section
          className={
            workspaceTab === "home" ||
            workspaceTab === "tasks" ||
            workspaceTab === "results" ||
            workspaceTab === "logs" ||
            workspaceTab === "access" ||
            workspaceTab === "reports" ||
            workspaceTab === "install" ||
            workspaceTab === "profile" ||
            (workspaceTab === "machines" && selectedMachine)
              ? "machines-content home-content"
              : "machines-content machines-content--machines"
          }
        >
          {workspaceTab === "home" ? (
            <section className="home-dashboard" aria-label="Р“Р»Р°РІРЅР°СЏ">
              {renderWorkspaceTopbar()}

              <div className="home-body">
                <div className="home-metrics">
                  {homeMetricCards.map((card) => {
                    const detailTone =
                      card.id === "tasks" ? "danger" : "success";

                    return (
                      <article
                        key={card.id}
                        className={`home-metric-card home-metric-card--${card.accent}`}
                      >
                        <header className="home-metric-card__header">
                          <p>{card.title}</p>
                          <span
                            className="home-metric-card__icon"
                            aria-hidden="true"
                          >
                            <img src={card.iconSrc} alt="" aria-hidden="true" />
                          </span>
                        </header>

                        <p className="home-metric-card__value">{card.value}</p>

                        {card.progress ? (
                          <>
                            <div className="home-metric-card__progress">
                              <span style={{ width: `${card.progress}%` }} />
                            </div>
                            <div className="home-metric-card__progress-labels">
                              <span>{card.progressLeft}</span>
                              <span>{card.progressRight}</span>
                            </div>
                          </>
                        ) : (
                          <p className="home-metric-card__detail">
                            {card.trendIconSrc ? (
                              <img
                                src={card.trendIconSrc}
                                alt=""
                                aria-hidden="true"
                                className="home-metric-card__trend-icon"
                              />
                            ) : null}
                            <strong className={detailTone}>
                              {card.detailValue}
                            </strong>
                            <span>{card.detailText}</span>
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="home-workspace">
                  <div className="home-main-column">
                    <section className="home-quick-actions">
                      <header className="home-block-title">
                        <h2>Быстрые действия</h2>
                      </header>

                      <div className="home-quick-actions__grid">
                        {visibleHomeActionCards.map((card) => (
                          <button
                            key={card.label}
                            type="button"
                            className="home-action-card"
                            onClick={() => handleHomeActionClick(card.label)}
                          >
                            <img src={card.iconSrc} alt="" aria-hidden="true" />
                            <span>{card.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="home-tasks">
                      <header className="home-tasks__header">
                        <h2>Активные задачи</h2>
                        <button type="button">Посмотреть все</button>
                      </header>

                      <table className="home-tasks__table">
                        <thead>
                          <tr>
                            <th>ID задачи</th>
                            <th>Машина</th>
                            <th>Статус</th>
                            <th>Время отправки</th>
                            <th>Отправитель</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleHomeTaskRows.map((row, index) => (
                            <tr key={`${row.id}_${index}`}>
                              <td>{row.id}</td>
                              <td>{row.machine}</td>
                              <td>{row.status}</td>
                              <td>{row.createdAt}</td>
                              <td>{row.sender}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  </div>

                  <aside className="home-errors">
                    <header className="home-errors__title">
                      <img src="/error.png" alt="" aria-hidden="true" />
                      <h3>Последние ошибки</h3>
                    </header>

                    <div className="home-errors__list">
                      {homeErrorItems.map((item, index) => (
                        <article
                          key={`${item.title}_${index}`}
                          className="home-error-item"
                        >
                          <p className="home-error-item__title">{item.title}</p>
                          <p>{item.createdAt}</p>
                          <p>{item.stoppedAt}</p>
                          <span>{item.ago}</span>
                        </article>
                      ))}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          ) : workspaceTab === "tasks" ? (
            <section className="tasks-dashboard" aria-label="Задачи">
              {renderWorkspaceTopbar()}

              <TasksWorkspace
                totalItems={taskCards.length}
                activeFilter={taskFilterStatus}
                sections={visibleTaskStatusGroups}
                onFilterChange={setTaskFilterStatus}
                onOpenLogs={openTaskLogs}
                onSecondaryAction={handleTaskSecondaryAction}
              />
            </section>
          ) : workspaceTab === "results" ? (
            <section className="results-dashboard" aria-label="Результаты">
              {renderWorkspaceTopbar()}

              <ResultsWorkspace
                rows={visibleResultRows}
                totalItems={resultHistoryRows.length}
                statusValue={resultsStatusFilter}
                machineValue={resultsMachineFilter}
                commandValue={resultsCommandFilter}
                dateRange={resultsDateRange}
                machineOptions={resultsFilterOptions.machineOptions}
                commandOptions={resultsFilterOptions.commandOptions}
                onStatusChange={setResultsStatusFilter}
                onMachineChange={setResultsMachineFilter}
                onCommandChange={setResultsCommandFilter}
                onDateRangeChange={setResultsDateRange}
                onOpenLogs={openTaskLogs}
                onOpenResultDetail={openResultDetail}
              />
            </section>
          ) : workspaceTab === "logs" ? (
            <>
              {renderWorkspaceTopbar()}
              <LogsWorkspace
                scopeSummary={logScopeSummary}
                filterTone={logFilterTone}
                statusStats={logStatusStats}
                totalEntries={logEntries.length}
                totalStreamItems={visibleLogStreamItems.length}
                autoScrollEnabled={logsAutoScrollEnabled}
                entries={visibleLogEntries}
                streamItems={visibleLogStreamItems}
                onFilterToneChange={setLogFilterTone}
                onToggleAutoScroll={() =>
                  setLogsAutoScrollEnabled((current) => !current)
                }
                onOpenTaskLogs={openTaskLogs}
              />
            </>
          ) : workspaceTab === "access" ? (
            <section className="access-dashboard" aria-label="Доступ">
              {renderWorkspaceTopbar()}

              <div className="access-dashboard__body">
                <header className="access-dashboard__header">
                  <h1>Управление доступом</h1>
                  <button
                    type="button"
                    className="access-dashboard__invite"
                    onClick={openInviteModal}
                    disabled={!accessMachines.length}
                  >
                    <span>Отправить приглашение</span>
                    <img src="/plus.png" alt="" aria-hidden="true" />
                  </button>
                </header>

                {accessNotice ? (
                  <p className="access-dashboard__notice" role="status">
                    {accessNotice}
                  </p>
                ) : null}

                {accessError && !isInviteModalOpen && !selectedManageRow ? (
                  <p className="access-dashboard__error" role="alert">
                    {accessError}
                  </p>
                ) : null}

                <div className="access-dashboard__stats">
                  {accessSummaryCards.map((card) => (
                    <article
                      key={card.id}
                      className={`access-stat-card ${card.tone === "highlight" ? "access-stat-card--highlight" : ""}`}
                    >
                      <p>{card.title}</p>
                      <div className="access-stat-card__value-row">
                        <strong>{card.value}</strong>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="access-dashboard__content">
                  <section className="access-users">
                    <div className="access-users__toolbar">
                      <div className="access-users__template" role="status">
                        <span>
                          {accessMachines.length
                            ? `Машин под управлением: ${accessMachines.length}`
                            : "Нет машин, для которых можно выдавать доступ"}
                        </span>
                      </div>

                      <label className="access-users__search">
                        <Search size={20} />
                        <input
                          type="text"
                          placeholder="Поиск по пользователям..."
                          value={workspaceSearchQuery}
                          onChange={(event) =>
                            setWorkspaceSearchQuery(event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="access-users__table-wrap">
                      <table className="access-users__table">
                        <thead>
                          <tr>
                            <th>Пользователь</th>
                            <th>Роль</th>
                            <th>Ресурс</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleAccessRows.length ? (
                            visibleAccessRows.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  <span className="access-users__user">
                                    <img
                                      src="/polsovatel.png"
                                      alt=""
                                      aria-hidden="true"
                                    />
                                    <span>{row.email}</span>
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`access-users__role access-users__role--${row.roleTone}`}
                                  >
                                    {row.role}
                                  </span>
                                </td>
                                <td>{row.resource}</td>
                                <td>
                                  <span
                                    className={`access-users__status access-users__status--${row.statusTone}`}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="access-users__action"
                                    disabled={!row.canManage}
                                    onClick={() => openManageAccessModal(row)}
                                  >
                                    {row.action}
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5}>Нет данных по доступам</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <footer className="access-users__footer">
                      <span>
                        Показано {visibleAccessRows.length} из{" "}
                        {accessUserRows.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWorkspaceSearchQuery("")}
                      >
                        Сбросить поиск
                      </button>
                    </footer>

                    <section className="access-invites">
                      <header className="access-invites__header">
                        <h2>Приглашения</h2>
                        <span>
                          Показано {visibleAccessInvites.length} из{" "}
                          {accessInviteRows.length}
                        </span>
                      </header>

                      <div className="access-users__table-wrap">
                        <table className="access-users__table access-users__table--invites">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Роль</th>
                              <th>Машина</th>
                              <th>Статус</th>
                              <th>Создано</th>
                              <th>Действует до</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleAccessInvites.length ? (
                              visibleAccessInvites.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.email}</td>
                                  <td>
                                    <span
                                      className={`access-users__role access-users__role--${row.roleValue}`}
                                    >
                                      {row.role}
                                    </span>
                                  </td>
                                  <td>{row.resource}</td>
                                  <td>
                                    <span
                                      className={`access-users__status access-users__status--${row.statusTone}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                  <td>{row.createdAt}</td>
                                  <td>{row.expiresAt}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6}>Нет приглашений</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </section>

                  <aside className="access-activity">
                    <h2>Журнал изменений</h2>

                    <div className="access-activity__list">
                      {accessActivityItems.length ? (
                        accessActivityItems.map((item) => (
                          <article
                            key={item.id}
                            className="access-activity__item"
                          >
                            <span className="access-activity__item-icon">
                              <img
                                src="/zhyrnl.png"
                                alt=""
                                aria-hidden="true"
                              />
                            </span>

                            <div className="access-activity__item-content">
                              <p>
                                <strong>{item.actor}</strong> {item.actionText}{" "}
                                {item.email}
                              </p>
                              <p>{item.role}</p>
                              <span>{item.time}</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p>Нет событий доступа</p>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          ) : workspaceTab === "reports" ? (
            <section className="reports-dashboard" aria-label="Отчёты">
              {renderWorkspaceTopbar()}

              <div className="reports-dashboard__body">
                <header className="reports-dashboard__header">
                  <h1>Отчёты и статистика</h1>

                  <button
                    type="button"
                    className="reports-dashboard__refresh"
                    onClick={handleReportsRefresh}
                    disabled={isReportsRefreshing}
                  >
                    <span>
                      {isReportsRefreshing
                        ? "Обновление..."
                        : "Обновить данные"}
                    </span>
                    <RefreshCw size={16} />
                  </button>
                </header>

                <ReportsWorkspace
                  reportPeriod={reportPeriod}
                  reportMachine={reportMachine}
                  reportTemplate={reportTemplate}
                  reportTeam={reportTeam}
                  machineOptions={reportMachineOptions}
                  templateOptions={reportTemplateOptions}
                  teamOptions={reportTeamOptions}
                  stats={reportStats}
                  trend={reportTrend}
                  rows={reportSummaryRows}
                  onPeriodChange={setReportPeriod}
                  onMachineChange={setReportMachine}
                  onTemplateChange={setReportTemplate}
                  onTeamChange={setReportTeam}
                  onAction={(row) => {
                    navigate(
                      row.actionLabel === "Смотреть логи"
                        ? logsPath()
                        : workspacePath("tasks"),
                    );
                  }}
                />
              </div>
            </section>
          ) : workspaceTab === "install" ? (
            <section className="install-dashboard" aria-label="Установка">
              {renderWorkspaceTopbar()}

              <div className="install-dashboard__body">
                <header className="install-dashboard__header">
                  <h1>Установка</h1>
                </header>

                <div className="install-dashboard__grid">
                  {installCards.map((card) => (
                    <article
                      key={card.id}
                      className={`install-card install-card--${card.id}`}
                    >
                      <span
                        className={
                          card.id === "windows"
                            ? "install-card__logo install-card__logo--windows"
                            : "install-card__logo install-card__logo--linux"
                        }
                        aria-hidden="true"
                      >
                        <img
                          src={
                            card.id === "windows"
                              ? "/windows.png"
                              : "/linux.png"
                          }
                          alt=""
                        />
                      </span>

                      <h2>{card.title}</h2>

                      <ul className="install-card__versions">
                        {card.versions.map((version) => (
                          <li key={version}>{version}</li>
                        ))}
                      </ul>

                      <div
                        className={`install-card__actions install-card__actions--${card.id}`}
                      >
                        {card.actions.map((action, index) => (
                          <button
                            key={action}
                            type="button"
                            disabled={
                              card.id === "windows" &&
                              action === "Desktop скоро"
                            }
                            className={
                              index === card.activeActionIndex
                                ? "install-card__action install-card__action--active"
                                : "install-card__action"
                            }
                            onClick={() => {
                              if (
                                card.id === "linux" &&
                                action === "Команды установки"
                              ) {
                                setIsLinuxInstallGuideOpen(true);
                                return;
                              }

                              const url = getInstallActionUrl(card.id, action);
                              if (url) {
                                window.location.assign(url);
                              }
                            }}
                          >
                            {action}
                          </button>
                        ))}
                      </div>

                      <p className="install-card__hint">{card.hint}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : workspaceTab === "profile" ? (
            <ProfileWorkspace
              activeSection={activeProfileSection}
              onNavigateSection={navigateProfileSection}
            >
              {renderWorkspaceTopbar()}
                  <input
                    ref={profileAvatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="profile-main-info__file"
                    onChange={handleProfileAvatarChange}
                  />
                  {activeProfileSection === "general" && profileDetails ? (
                    <ProfileGeneralSection
                      profile={profileDetails}
                      firstName={profileFirstName}
                      lastName={profileLastName}
                      avatarDataUrl={profileAvatarUrl}
                      deletedMachineRetention={profileDeletedRetention}
                      isSaving={isProfileSaving}
                      notice={profileSaveNotice}
                      error={profileSaveError}
                      onFirstNameChange={setProfileFirstName}
                      onLastNameChange={setProfileLastName}
                      onRetentionChange={setProfileDeletedRetention}
                      onAvatarPick={() => profileAvatarInputRef.current?.click()}
                      onSubmit={handleProfileSave}
                    />
                  ) : null}

                  {activeProfileSection === "security" && profileDetails ? (
                    <ProfileSecuritySection
                      profile={profileDetails}
                      passwordForm={passwordForm}
                      passwordIssues={passwordIssues}
                      isPasswordSubmitting={isPasswordSubmitting}
                      passwordNotice={passwordNotice}
                      passwordError={passwordError}
                      onPasswordFieldChange={handlePasswordFieldChange}
                      onPasswordSubmit={handlePasswordSubmit}
                      totpSetup={totpSetup}
                      totpCode={totpCode}
                      isTotpLoading={isTotpLoading}
                      totpNotice={totpNotice}
                      totpError={totpError}
                      onTotpCodeChange={setTotpCode}
                      onTotpStart={handleTotpStart}
                      onTotpConfirm={handleTotpConfirm}
                      onTotpDisable={handleTotpDisable}
                      telegramSetupState={telegramSetupState}
                      isTelegramLoading={isTelegramLoading}
                      telegramNotice={telegramNotice}
                      telegramError={telegramError}
                      onTelegramLink={handleTelegramLink}
                      onTelegramEnable={handleTelegramEnable}
                      onTelegramDisable={handleTelegramDisable}
                      onTelegramUnlink={handleTelegramUnlink}
                    />
                  ) : null}

                  {activeProfileSection === "sessions" ? (
                    <ProfileSessionsSection
                      sessions={accountSessions}
                      isLoading={isSessionsLoading}
                      isRevoking={isSessionRevoking}
                      notice={sessionsNotice}
                      error={sessionsError}
                      onRevoke={handleSessionRevoke}
                    />
                  ) : null}

                  {activeProfileSection === "notifications" ? (
                    <ProfileNotificationsSection
                      preferences={notificationPreferences}
                      notifications={notificationFeed}
                      unreadCount={unreadNotificationCount}
                      isLoading={isNotificationsLoading}
                      isSaving={isNotificationsSaving}
                      notice={notificationsNotice}
                      error={notificationsError}
                      onToggle={handleNotificationToggle}
                      onSave={handleNotificationPreferencesSave}
                      onMarkRead={handleMarkNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onNavigate={handleOpenNotificationTarget}
                    />
                  ) : null}

                  {activeProfileSection === "api-keys" ? (
                    <ApiKeysWorkspace
                      items={apiKeys}
                      machineOptions={apiKeyMachineOptions}
                      isLoading={isApiKeysLoading}
                      isSubmitting={isApiKeySubmitting}
                      isRevoking={isApiKeyRevoking}
                      createForm={apiKeyForm}
                      latestRawKey={latestApiKeySecret}
                      notice={apiKeysNotice}
                      error={apiKeysError}
                      onFieldChange={handleApiKeyFieldChange}
                      onToggleMachine={handleApiKeyMachineToggle}
                      onCreate={handleApiKeyCreate}
                      onRevoke={handleApiKeyRevoke}
                    />
                  ) : null}

            </ProfileWorkspace>
          ) : selectedMachine ? (
            <section className="machine-details" aria-label="Карточка машины">
              {renderWorkspaceTopbar()}

              <div className="machine-details__body">
                <MachineWorkspace
                  activeSection={selectedMachineRouteTab}
                  machine={{
                    id: selectedMachine.id,
                    name: getMachineDisplayName(selectedMachine),
                    hostname: selectedMachine.hostname,
                    os: selectedMachine.os,
                    heartbeat: selectedMachine.heartbeat,
                    owner: selectedMachine.owner,
                    role: selectedMachine.myRole,
                    status: selectedMachine.status,
                    statusLabel: machineStatusLabelByStatus[selectedMachine.status],
                  }}
                  canCreateTask={selectedMachineCanCreateTask}
                  taskRoleLabel={selectedMachine.myRole}
                  taskTemplateOptions={taskTemplateOptions}
                  selectedTaskTemplateKey={taskCommand}
                  selectedTaskParameterValues={taskParamValues}
                  taskUseSudo={taskUseSudo}
                  taskShellLabel={taskPreviewShellLabel}
                  taskPreviewCommand={taskPreviewCommand}
                  canSubmitTask={canSubmitTask}
                  onTaskTemplateChange={setTaskCommand}
                  onTaskParameterChange={(parameterKey, value) =>
                    setTaskParamValues((current) => ({
                      ...current,
                      [parameterKey]: value,
                    }))
                  }
                  onTaskUseSudoChange={setTaskUseSudo}
                  onTaskReset={resetTaskComposer}
                  onTaskSubmit={handleCreateTaskSubmit}
                  onCopyTaskPreview={copyTaskPreview}
                  tasks={selectedMachineTaskCards}
                  results={selectedMachineResultRows}
                  logs={selectedMachineLogEntries}
                  onOpenTasks={() => openMachine(selectedMachine.id, "tasks")}
                  onOpenResults={() => openMachine(selectedMachine.id, "results")}
                  onOpenLogs={() => openMachine(selectedMachine.id, "logs")}
                  onOpenTaskLogs={(taskId) => openTaskLogs(taskId, selectedMachine.id)}
                  onOpenResultDetail={(resultId) =>
                    openResultDetail(resultId, selectedMachine.id)
                  }
                />
              </div>
            </section>
          ) : (
            <section className="machines-dashboard" aria-label="Машины">
              {renderWorkspaceTopbar()}

              <header className="machines-dashboard__header">
                <div className="machines-dashboard__title-box">
                  <h1>Машины</h1>
                  <p>Всего {machineDashboardCards.length}</p>
                </div>

                <button
                  type="button"
                  className="machines-dashboard__add-button"
                  onClick={() =>
                    navigate(
                      isAddMachineRoute ? workspacePath("machines") : addMachinePath(),
                    )
                  }
                >
                  {isAddMachineRoute ? "Скрыть форму" : "Добавить машину"}
                </button>
              </header>

              <p className="machines-dashboard__retention-note">
                Удалённые машины хранятся согласно настройке профиля:{" "}
                <strong>{getRetentionLabel(profileDeletedRetention)}</strong>.
              </p>

              {isAddMachineRoute ? (
                <AddMachineCard
                  command={AGENT_PAIR_COMMAND}
                  deviceCode={addMachineCode}
                  displayName={addMachineDisplayName}
                  errorMessage={addMachineError}
                  isSubmitting={isAddMachineSubmitting}
                  onDeviceCodeChange={(value) => {
                    setAddMachineCode(value);
                    if (addMachineError) {
                      setAddMachineError(null);
                    }
                  }}
                  onDisplayNameChange={(value) => {
                    setAddMachineDisplayName(value);
                    if (addMachineError) {
                      setAddMachineError(null);
                    }
                  }}
                  onReset={resetAddMachineForm}
                  onSubmit={handleAddMachineSubmit}
                  onCopyCommand={copyAddMachineCommand}
                />
              ) : null}

              <div className="machines-dashboard__statuses">
                {machineStatusGroups.map((section) => {
                  return (
                    <p
                      key={section.key}
                      className="machines-dashboard__status-item"
                    >
                      <span
                        className={`machines-dashboard__status-dot machines-dashboard__status-dot--${section.key}`}
                      />
                      <span>{`${section.label} (${section.cards.length})`}</span>
                    </p>
                  );
                })}
              </div>

              <div className="machines-dashboard__columns">
                {machineStatusGroups.map((section) => {
                  return (
                    <section
                      key={section.key}
                      className="machines-status-column"
                    >
                      <div className="machines-status-column__cards">
                        {section.cards.length ? (
                          section.cards.map((card) => (
                            <article
                              key={card.id}
                              className="machine-status-card machine-status-card--interactive"
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                openMachine(card.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openMachine(card.id);
                                }
                              }}
                            >
                              <div className="machine-status-card__top">
                                <div>
                                  <h3>{card.machine}</h3>
                                  <p>{card.os}</p>
                                </div>

                                <div className="machine-status-card__meta">
                                  <span
                                    className={`machine-status-card__badge machine-status-card__badge--${card.badgeTone}`}
                                  >
                                    {card.owner
                                      .trim()
                                      .split("@")[1]
                                      ?.slice(0, 2) ?? ""}
                                  </span>
                                </div>
                              </div>

                              <p
                                className={`machine-status-card__heartbeat machine-status-card__heartbeat--${card.status}`}
                              >
                                {card.heartbeat}
                              </p>

                              <p className="machine-status-card__owner">
                                <img src="/user.png" alt="" aria-hidden="true" />
                                <span>{card.owner}</span>
                              </p>
                            </article>
                          ))
                        ) : (
                          <div className="machines-status-column__empty">
                            <EmptyState
                              title="Пусто"
                              description={
                                section.key === "deleted"
                                  ? "Удалённые машины появятся здесь и будут скрыты автоматически по сроку хранения."
                                  : "Сейчас в этой группе нет машин."
                              }
                            />
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        {route.section === "workspace" && route.modal?.kind === "task-logs" ? (
          <ConsoleModal taskId={route.modal.taskId} onClose={closeRouteModal} />
        ) : null}

        {route.section === "workspace" && route.modal?.kind === "machine-task-logs" ? (
          <ConsoleModal taskId={route.modal.taskId} onClose={closeRouteModal} />
        ) : null}

        {route.section === "workspace" && route.modal?.kind === "result-detail" ? (
          <ResultDetailModal
            resultId={route.modal.resultId}
            onClose={closeRouteModal}
          />
        ) : null}

        {route.section === "workspace" && route.modal?.kind === "machine-result" ? (
          <ResultDetailModal
            resultId={route.modal.resultId}
            onClose={closeRouteModal}
          />
        ) : null}

        {isInviteModalOpen ? (
          <InviteAccessModal
            machineOptions={inviteMachineOptions}
            roleOptions={inviteRoleOptions}
            selectedMachineId={selectedInviteMachine?.id ?? ""}
            selectedRole={inviteRole}
            email={inviteEmail}
            password={invitePassword}
            errorMessage={accessError}
            isSubmitting={isInviteSubmitting}
            onMachineChange={handleInviteMachineChange}
            onRoleChange={setInviteRole}
            onEmailChange={setInviteEmail}
            onPasswordChange={setInvitePassword}
            onClose={closeInviteModal}
            onSubmit={handleCreateInviteSubmit}
          />
        ) : null}

        {selectedManageRow ? (
          <ManageAccessModal
            row={selectedManageRow}
            roleOptions={manageRoleOptions}
            selectedRole={manageRole}
            password={managePassword}
            errorMessage={accessError}
            isSubmitting={isManageSubmitting}
            onRoleChange={setManageRole}
            onPasswordChange={setManagePassword}
            onClose={closeManageAccessModal}
            onSubmit={handleManageAccessSubmit}
            onRevoke={handleRevokeAccess}
          />
        ) : null}

        {isLinuxInstallGuideOpen ? (
          <div
            className="install-guide-modal__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="linux-install-guide-title"
            onClick={closeLinuxInstallGuide}
          >
            <section
              className="install-guide-modal"
              onClick={(event) => event.stopPropagation()}
            >
              {linuxInstallGuideSteps.map((step, index) => (
                <div key={step.title} className="install-guide-modal__section">
                  <h3
                    id={index === 0 ? "linux-install-guide-title" : undefined}
                    className={
                      index === 0
                        ? "install-guide-modal__title install-guide-modal__title--main"
                        : "install-guide-modal__title"
                    }
                  >
                    {step.title}
                  </h3>

                  <article className="install-guide-modal__code-card">
                    <header>
                      <span>&lt;/&gt; Bash</span>

                      <button
                        type="button"
                        className="install-guide-modal__copy"
                        aria-label="Скопировать команды"
                        onClick={() => copyLinuxGuideCommands(step.commands)}
                      >
                        <img src="/copy.png" alt="" aria-hidden="true" />
                      </button>
                    </header>

                    <pre>
                      {step.commands.map((commandLine) => (
                        <span
                          key={commandLine}
                          className="install-guide-modal__command-line"
                        >
                          {renderLinuxInstallCommandTokens(commandLine)}
                        </span>
                      ))}
                    </pre>
                  </article>
                </div>
              ))}

              <div className="install-guide-modal__actions">
                <button
                  type="button"
                  className="install-guide-modal__btn install-guide-modal__btn--secondary"
                  onClick={closeLinuxInstallGuide}
                >
                  Скрыть
                </button>

                <button
                  type="button"
                  className="install-guide-modal__btn install-guide-modal__btn--primary"
                  onClick={() => {
                    const url = getInstallActionUrl(
                      "linux",
                      "Установить архив",
                    );
                    if (url) {
                      window.location.assign(url);
                    }
                  }}
                >
                  Установить архив
                </button>
              </div>

              <p className="install-guide-modal__hint">
                На Linux доступен только systemd-сервис без графического интерфейса
              </p>
            </section>
          </div>
        ) : null}

        {isCreateTaskOpen ? (
          <div
            className="task-create-modal__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-create-title"
            onClick={closeCreateTaskModal}
          >
            <form
              className="task-create-modal"
              onSubmit={handleCreateTaskSubmit}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="task-create-modal__close"
                aria-label="Закрыть"
                onClick={closeCreateTaskModal}
              >
                <X size={20} />
              </button>

              <div className="task-create-modal__head">
                <p>Новая задача</p>
                <h2 id="task-create-title">Создание задачи</h2>
              </div>

              <label className="task-create-modal__field">
                <span>Машина</span>
                <CustomSelect
                  value={taskMachineId}
                  options={[
                    { value: "", label: "Выбрать" },
                    ...machineDashboardCards.map((machine) => ({
                      value: machine.id,
                      label: getMachineDisplayName(machine),
                    })),
                  ]}
                  onChange={setTaskMachineId}
                  ariaLabel="Выбор машины для задачи"
                />
              </label>

              <label className="task-create-modal__field">
                <span>Команда</span>
                <CustomSelect
                  value={taskCommand}
                  options={[
                    {
                      value: "",
                      label: taskMachineId ? "Выбрать" : "Сначала выберите машину",
                    },
                    ...taskTemplateOptions.map((template) => ({
                      value: template.templateKey,
                      label: template.name,
                    })),
                  ]}
                  onChange={setTaskCommand}
                  disabled={!taskMachineId || !taskTemplateOptions.length}
                  ariaLabel="Выбор команды для задачи"
                />
              </label>

              {selectedTaskTemplate ? (
                <div className="task-create-modal__params">
                  {selectedTaskTemplate.parameters.map((parameter) => (
                    <label
                      key={parameter.key}
                      className="task-create-modal__field"
                    >
                      <span>{parameter.label}</span>
                      <CustomSelect
                        value={taskParamValues[parameter.key] ?? ""}
                        options={parameter.allowedValues.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                        onChange={(value) =>
                          setTaskParamValues((current) => ({
                            ...current,
                            [parameter.key]: value,
                          }))
                        }
                        ariaLabel={`Параметр ${parameter.label}`}
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              <button type="submit" className="task-create-modal__submit">
                Создать задачу
              </button>
            </form>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-page__ambient auth-page__ambient--left" />
      <div className="auth-page__ambient auth-page__ambient--right" />

      <section
        className="auth-card"
        aria-label={
          authMode === "login"
            ? "Страница входа"
            : authMode === "register"
              ? "Страница регистрации"
              : authMode === "forgot-password"
                ? "Сброс пароля"
                : authMode === "reset-password"
                  ? "Обновление пароля"
                  : "Подтверждение входа"
        }
      >
        <div className="auth-card__preview">
          <div className="auth-card__preview-window">
            <div className="auth-card__window-chrome">
              <span />
              <span />
              <span />
            </div>
            <img
              src="/auth.jpg"
              alt="Превью панели Predict MV"
              className="auth-card__preview-image"
            />
          </div>
        </div>

        <div className="auth-card__content">
          <header className="brand-block">
            <p className="brand-block__name">PREDICT MV</p>
            <p className="brand-block__tagline">Контроль инфраструктуры под рукой</p>
          </header>

          {authMode === "confirm" ? (
            <section className="confirm-panel" aria-label="Подтверждение входа">
              <div className="confirm-panel__icon" aria-hidden="true">
                <Shield size={34} />
              </div>

              <div className="confirm-panel__heading">
                <h1>Подтверждение входа</h1>
                <p>
                  Мы отправили код подтверждения в{" "}
                  <a href="#telegram">Telegram</a>
                </p>
              </div>

              <form className="confirm-form" onSubmit={handleConfirmSubmit}>
                <label className="field">
                  <span>Код подтверждения</span>
                  <div className="field__control field__control--centered">
                    <input
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="Введите 6-значный код"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>
                </label>

                {authNotice ? <p className="profile-card__notice">{authNotice}</p> : null}
                {authError ? <p className="profile-card__error">{authError}</p> : null}

                <button className="submit-button" type="submit">
                  <span>Подтвердить вход</span>
                </button>
              </form>

              <p className="confirm-panel__resend">
                <span>Не приходит код?</span>{" "}
                <button type="button">Отправить ещё раз</button>
              </p>

              <button
                type="button"
                className="confirm-panel__back"
                onClick={() => {
                  setAuthChallengeId(null);
                  setAuthMode("login");
                }}
              >
                Назад
              </button>

              <p className="confirm-panel__legal">
                Нажимая кнопку "Подтвердить вход" выше, вы подтверждаете, что
                ознакомились и согласны с{" "}
                <a href="#terms">Условиями пользования</a> и{" "}
                <a href="#privacy">Политикой конфиденциальности</a>
              </p>
            </section>
          ) : authMode === "forgot-password" ? (
            <section className="auth-panel">
              <div className="auth-panel__heading">
                <h1>Сброс пароля</h1>
                <p>Введите email, и мы отправим письмо для восстановления доступа.</p>
              </div>

              <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
                <label className="field">
                  <span>Email</span>
                  <div className="field__control">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                    />
                  </div>
                </label>

                {authNotice ? <p className="profile-card__notice">{authNotice}</p> : null}
                {authError ? <p className="profile-card__error">{authError}</p> : null}

                <button className="submit-button" type="submit">
                  <span>Отправить письмо</span>
                </button>
              </form>

              <p className="auth-panel__footer">
                <button type="button" onClick={() => setAuthMode("login")}>
                  Вернуться ко входу
                </button>
              </p>
            </section>
          ) : authMode === "reset-password" ? (
            <section className="auth-panel">
              <div className="auth-panel__heading">
                <h1>Новый пароль</h1>
                <p>Задайте новый пароль для аккаунта и подтвердите его.</p>
              </div>

              <form className="auth-form" onSubmit={handleResetPasswordSubmit}>
                {!resetTokenFromUrl ? (
                  <label className="field">
                    <span>Токен сброса</span>
                    <div className="field__control">
                      <Shield size={16} />
                      <input
                        type="text"
                        value={manualResetToken}
                        onChange={(event) => setManualResetToken(event.target.value)}
                        placeholder="Вставьте токен из письма"
                      />
                    </div>
                  </label>
                ) : null}

                <label className="field">
                  <span>Новый пароль</span>
                  <div className="field__control field__control--password">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="field__toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Подтвердите новый пароль</span>
                  <div className="field__control field__control--password">
                    <Lock size={16} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="field__toggle"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      aria-label={
                        showConfirmPassword ? "Скрыть пароль" : "Показать пароль"
                      }
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {password ? (
                  <ul className="profile-validation-list">
                    {validatePasswordPolicy(password).map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
                {authNotice ? <p className="profile-card__notice">{authNotice}</p> : null}
                {authError ? <p className="profile-card__error">{authError}</p> : null}

                <button className="submit-button" type="submit">
                  <span>Обновить пароль</span>
                </button>
              </form>

              <p className="auth-panel__footer">
                <button type="button" onClick={() => setAuthMode("login")}>
                  Вернуться ко входу
                </button>
              </p>
            </section>
          ) : (
            <section className="auth-panel">
              <div className="auth-panel__heading">
                <h1>{authMode === "login" ? "Вход в аккаунт" : "Регистрация"}</h1>
                <p>
                  {authMode === "login"
                    ? "Авторизуйтесь, чтобы продолжить"
                    : "Зарегистрируйтесь, чтобы продолжить"}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <label className="field">
                  <span>Email</span>
                  <div className="field__control">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Пароль</span>
                  <div className="field__control field__control--password">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="field__toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {authMode === "login" ? (
                  <p className="confirm-panel__resend">
                    <span>Забыли пароль?</span>{" "}
                    <button type="button" onClick={() => setAuthMode("forgot-password")}>
                      Восстановить доступ
                    </button>
                  </p>
                ) : null}

                {authMode === "register" ? (
                  <>
                    <label className="field">
                      <span>Повторите пароль</span>
                      <div className="field__control field__control--password">
                        <Lock size={16} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="field__toggle"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          aria-label={
                            showConfirmPassword ? "Скрыть пароль" : "Показать пароль"
                          }
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <label className="consent-row">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(event) => setAcceptTerms(event.target.checked)}
                      />
                      <span>Я даю согласие на обработку персональных данных</span>
                    </label>
                  </>
                ) : null}

                {authNotice ? <p className="profile-card__notice">{authNotice}</p> : null}
                {authError ? <p className="profile-card__error">{authError}</p> : null}

                <button className="submit-button" type="submit">
                  <span>{authMode === "login" ? "Войти" : "Зарегистрироваться"}</span>
                </button>
              </form>

              <p className="auth-panel__footer">
                {authMode === "login" ? (
                  <>
                    Нет аккаунта?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthChallengeId(null);
                        setAuthMode("register");
                      }}
                    >
                      Зарегистрироваться
                    </button>
                  </>
                ) : (
                  <>
                    Есть аккаунт?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthChallengeId(null);
                        setAuthMode("login");
                      }}
                    >
                      Войти
                    </button>
                  </>
                )}
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

