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
  type AccessDashboardResponse,
  type CommandTemplateOption,
  type LogsDashboardResponse,
  type ProfileDashboardResponse,
  type ResultsDashboardResponse,
  type ReportsDashboardResponse,
  type TaskCardResponse,
} from "./core";
import { ApiError } from "./core/http";
import {
  matchesSearchQuery,
  normalizeMachineTitle,
} from "./core/ui";
import {
  addMachinePath,
  logsPath,
  machineResultPath,
  machineTaskLogsPath,
  machinePath,
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
  terminateAuthSession,
} from "./app/auth-session";
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
import { MachineWorkspace } from "./components/operations/machine/MachineWorkspace";
import { InviteAccessModal } from "./components/access/InviteAccessModal";
import { ManageAccessModal } from "./components/access/ManageAccessModal";
import { ResultsWorkspace } from "./components/operations/results/ResultsWorkspace";
import { TasksWorkspace } from "./components/operations/tasks/TasksWorkspace";

const apiClient = api;

type AuthMode = "login" | "register" | "confirm";
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
type ProfileSection = "general" | "security" | "sessions" | "notifications";

type MachineCardStatus = "online" | "running" | "offline";

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
] as const;

const machineStatusLabelByStatus: Record<MachineCardStatus, string> = {
  online: "Онлайн",
  running: "Выполняет задачу",
  offline: "Оффлайн",
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
  { label: "Отчеты", iconSrc: "/otch.png", tab: "reports" },
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
    hint: "Сейчас доступен daemon-установщик. Desktop-клиент подключим сразу после сборки отдельного артефакта",
  },
  {
    id: "linux",
    title: "Linux",
    versions: ["Ubuntu 22.04+ x86_64", "Debian 12+ x86_64"],
    actions: ["Команды установки", "Скачать архив"],
    activeActionIndex: 0,
    hint: "На Linux ставится только systemd-сервис без графического клиента",
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

const profileSections: Array<{ key: ProfileSection; label: string }> = [
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

function mapSessionKindLabel(sessionKind: "web" | "desktop" | "cli"): string {
  if (sessionKind === "web") return "Браузер";
  if (sessionKind === "desktop") return "Desktop";
  return "CLI";
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
      ? route.authMode === "register" || route.authMode === "confirm"
        ? route.authMode
        : "login"
      : "login";
  const workspaceTab: WorkspaceTab =
    route.section === "workspace" ? route.workspaceTab : "machines";
  const isAddMachineRoute =
    route.section === "workspace" && route.workspaceTab === "machines"
      ? Boolean(route.isAddMachine)
      : false;
  const selectedMachineId = route.section === "workspace" ? route.machineId ?? null : null;
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
  const [profileSection, setProfileSection] =
    useState<ProfileSection>("general");
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileNotifications, setProfileNotifications] = useState({
    taskCompleted: false,
    warnings: true,
    reports: true,
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

  const setScreen = (nextScreen: AppScreen) => {
    if (nextScreen === "auth") {
      navigate("/login");
      return;
    }

    navigate(workspacePath("machines"));
  };

  const setAuthMode = (nextMode: AuthMode) => {
    navigate(
      nextMode === "login"
        ? "/login"
        : nextMode === "register"
          ? "/register"
          : "/confirm",
    );
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
    if (!profileDashboard) return "Имя Фамилия";
    const trimmed = profileDashboard.fullName.trim();
    return trimmed || "Имя Фамилия";
  }, [profileDashboard]);

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

  const profileSessions = useMemo(() => {
    if (!profileDashboard) return [];

    return [
      {
        id: `${profileDashboard.userId}_${profileDashboard.sessionKind}`,
        deviceLabel: mapSessionKindLabel(profileDashboard.sessionKind),
        description: profileDashboard.email,
        isCurrent: true,
      },
    ];
  }, [profileDashboard]);

  useEffect(() => {
    if (!profileDashboard) return;
    setProfileFirstName(profileDashboard.firstName);
    setProfileLastName(profileDashboard.lastName);
  }, [profileDashboard]);

  useEffect(() => {
    setWorkspaceSearchQuery("");
  }, [workspaceTab, selectedMachineId]);

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
      navigate(workspacePath("machines"));
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

  const handleTerminateProfileSession = async () => {
    setIsCreateTaskOpen(false);
    setIsLinuxInstallGuideOpen(false);
    setAuthChallengeId(null);
    try {
      await terminateAuthSession();
    } catch {
      // Ignore logout cleanup failures and continue clearing local screen state.
    }
    setProfileDashboard(null);
    setAuthMode("login");
    setScreen("auth");
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
      return;
    }

    try {
      const machine = await apiClient.confirmMachineRegistration({
        deviceCode: addMachineCode,
        displayName: addMachineDisplayName,
      });
      setAddMachineCode("");
      setAddMachineDisplayName("");
      const machines = await apiClient.getMachines();
      setMachineDashboardCards(machines);
      navigate(machinePath(machine.id));
    } catch {
      return;
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
      } catch {
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
    } catch {
      return;
    }
  };

  const handleConfirmSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

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
    } catch {
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
                  ? "Поиск по отчетам"
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
      subtitle: profileDisplayName,
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
  }, [machineDashboardCards, profileDisplayName, resultHistoryRows, taskCards]);

  const globalSearchResults = useMemo(
    () => getSearchMatches(workspaceSearchQuery, globalSearchTargets),
    [globalSearchTargets, workspaceSearchQuery],
  );

  const handleSelectGlobalSearchResult = (result: SearchMatch) => {
    setWorkspaceSearchQuery("");
    navigate(result.href);
  };

  const renderWorkspaceTopbar = () => (
    <Topbar
      searchQuery={workspaceSearchQuery}
      searchPlaceholder={workspaceSearchPlaceholder}
      searchResults={globalSearchResults}
      onSearchChange={setWorkspaceSearchQuery}
      onSelectSearchResult={handleSelectGlobalSearchResult}
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
                      ? "Страница отчетов"
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
          profileLabel={profileDisplayName}
          isProfileActive={workspaceTab === "profile"}
          isInstallActive={workspaceTab === "install"}
          onProfileClick={() => {
            navigate(workspacePath("profile"));
            setProfileSection("general");
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
            <section className="home-dashboard" aria-label="Главная">
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
                            <th>ID Задачи</th>
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
              {false ? <div className="tasks-body">

                <header className="tasks-dashboard__header">
                  <div className="tasks-dashboard__title-box">
                    <h1>Задачи</h1>
                    <p>Всего {taskCards.length}</p>
                  </div>
                </header>

                <div className="tasks-dashboard__controls">
                  <button
                    type="button"
                    className={`tasks-dashboard__chip ${taskFilterStatus === "all" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("all")}
                  >
                    Все
                  </button>
                  <button
                    type="button"
                    className={`tasks-dashboard__chip ${taskFilterStatus === "completed" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("completed")}
                  >
                    Завершенные
                  </button>
                  <button
                    type="button"
                    className={`tasks-dashboard__chip ${taskFilterStatus === "in_progress" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("in_progress")}
                  >
                    В процессе
                  </button>
                  <button
                    type="button"
                    className={`tasks-dashboard__chip ${taskFilterStatus === "queued" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("queued")}
                  >
                    В очереди
                  </button>
                  <button
                    type="button"
                    className={`tasks-dashboard__chip ${taskFilterStatus === "error" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("error")}
                  >
                    Ошибки
                  </button>
                </div>

                <div className="tasks-dashboard__statuses">
                  {visibleTaskStatusGroups.map((section) => (
                    <p
                      key={section.key}
                      className="tasks-dashboard__status-item"
                    >
                      <span>{`${section.label} (${section.cards.length})`}</span>
                    </p>
                  ))}
                </div>

                <div
                  className={`tasks-dashboard__columns tasks-dashboard__columns--${visibleTaskStatusGroups.length}`}
                >
                  {visibleTaskStatusGroups.map((section) => (
                    <section key={section.key} className="tasks-status-column">
                      <div className="tasks-status-column__cards">
                        {section.cards.map((task, index) => {
                          const secondaryActionLabel =
                            task.status === "in_progress" || task.status === "queued"
                              ? "Отменить"
                              : "Повторить";
                          const primaryActionLabel =
                            task.status === "in_progress" || task.status === "queued"
                              ? "Детали"
                              : "Посмотреть логи";
                          const completedLabel =
                            task.status === "error" ? "Прервана" : "Завершена";

                          return (
                            <article
                              key={`${task.taskNumber}_${index}`}
                              className={`task-card task-card--${task.status}`}
                            >
                              <div className="task-card__header">
                                <div className="task-card__title-box">
                                  <p className="task-card__number">
                                    Задача №{task.taskNumber}
                                  </p>
                                  <h3 className="task-card__title">
                                    {task.title}
                                  </h3>
                                </div>

                                <div className="task-card__timeline">
                                  <p>Запущена: {task.startedAt}</p>
                                  {task.completedAt ? (
                                    <p>{`${completedLabel}: ${task.completedAt}`}</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="task-card__divider" />

                              <div className="task-card__footer">
                                <div className="task-card__server">
                                  <img
                                    src="/server.png"
                                    alt=""
                                    aria-hidden="true"
                                  />
                                  <span>{task.machine}</span>
                                </div>
                                <div
                                  className={`task-card__result task-card__result--${task.resultColor}`}
                                >
                                  <img
                                    src={
                                      task.resultColor === "green"
                                        ? "/greenport.png"
                                        : task.resultColor === "yellow"
                                          ? "/openport.png"
                                          : "/closeport.png"
                                    }
                                    alt=""
                                    aria-hidden="true"
                                  />
                                  <span>{task.resultText}</span>
                                </div>
                              </div>

                              <div className="task-card__actions">
                                <button
                                  type="button"
                                  className="task-card__btn task-card__btn--secondary"
                                  onClick={() => handleTaskSecondaryAction(task)}
                                >
                                  {secondaryActionLabel}
                                </button>
                                <button
                                  type="button"
                                  className="task-card__btn task-card__btn--primary"
                                  onClick={() => openTaskLogs(task.id, task.machineId)}
                                >
                                  {primaryActionLabel}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div> : null}
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
              {false ? <div className="results-dashboard__body">
                <header className="results-dashboard__header">
                  <h1>Результаты</h1>
                </header>

                <div className="results-dashboard__filters">
                  <label className="results-filter">
                    <select
                      value={resultsStatusFilter}
                      onChange={(event) =>
                        setResultsStatusFilter(
                          event.target.value as "all" | ResultStatusTone,
                        )
                      }
                    >
                      <option value="all">Статус</option>
                      <option value="success">Выполнено</option>
                      <option value="error">Ошибка</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </label>

                  <label className="results-filter">
                    <select
                      value={resultsMachineFilter}
                      onChange={(event) =>
                        setResultsMachineFilter(event.target.value)
                      }
                    >
                      <option value="all">Машина</option>
                      {resultsMachineOptions.map((machine) => (
                        <option key={machine} value={machine}>
                          {machine}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="results-filter">
                    <select
                      value={resultsCommandFilter}
                      onChange={(event) =>
                        setResultsCommandFilter(event.target.value)
                      }
                    >
                      <option value="all">Команда</option>
                      {resultsCommandOptions.map((command) => (
                        <option key={command} value={command}>
                          {command}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="results-filter">
                    <select
                      value={resultsDateFilter}
                      onChange={(event) =>
                        setResultsDateFilter(event.target.value)
                      }
                    >
                      <option value="all">Дата результата</option>
                      <option value="today">Сегодня</option>
                    </select>
                  </label>
                </div>

                {resultsMachineFilter !== "all" ? (
                  <div className="results-dashboard__chips">
                    <button
                      type="button"
                      className="results-chip"
                      onClick={() => setResultsMachineFilter("all")}
                    >
                      <span>{resultsMachineFilter}</span>
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                ) : null}

                <section className="results-table-card">
                  <header className="results-table-card__header">
                    <h2>История запусков</h2>

                    <span className="results-table-card__caption">Поиск выполняется через верхнюю панель</span>
                  </header>

                  <table className="results-table-card__grid">
                    <thead>
                      <tr>
                        <th>Название</th>
                        <th>Статус</th>
                        <th>Машина</th>
                        <th>Команда</th>
                        <th>Дата результата</th>
                        <th>Действия</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleResultRows.length ? (
                        visibleResultRows.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <button
                                type="button"
                                className="results-actions__details"
                                onClick={() =>
                                  openResultDetail(row.id, row.machineId)
                                }
                              >
                                {row.title}
                              </button>
                            </td>
                            <td>
                              <span
                                className={`results-status results-status--${row.statusTone}`}
                              >
                                {row.statusLabel}
                              </span>
                            </td>
                            <td>{row.machine}</td>
                            <td>
                              <span className="results-command">
                                {row.command}
                              </span>
                            </td>
                            <td>{row.resultAt}</td>
                            <td>
                              <div className="results-actions">
                                <button
                                  type="button"
                                  className="results-actions__logs"
                                  onClick={() =>
                                    openTaskLogs(row.taskId, row.machineId)
                                  }
                                >
                                  Смотреть логи
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>
                            Нет результатов для выбранных фильтров
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </div> : null}
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
                      <button type="button" className="access-users__template">
                        <span>Шаблон DV-Sync</span>
                        <img src="/arrow.png" alt="" aria-hidden="true" />
                      </button>

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
            <section className="reports-dashboard" aria-label="Отчеты">
              {renderWorkspaceTopbar()}

              <div className="reports-dashboard__body">
                <header className="reports-dashboard__header">
                  <h1>Отчеты и статистика</h1>

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

                <div className="reports-dashboard__filters">
                  <label className="reports-filter reports-filter--period">
                    <select
                      value={reportPeriod}
                      onChange={(event) =>
                        setReportPeriod(event.target.value as ReportPeriod)
                      }
                    >
                      <option value="day">Период</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
                      <option value="all">Все время</option>
                    </select>
                  </label>

                  <label className="reports-filter reports-filter--machine">
                    <select
                      value={reportMachine}
                      onChange={(event) => setReportMachine(event.target.value)}
                    >
                      <option value="all">Все машины</option>
                      {reportMachineOptions.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="reports-filter reports-filter--template">
                    <select
                      value={reportTemplate}
                      onChange={(event) =>
                        setReportTemplate(event.target.value)
                      }
                    >
                      <option value="all">Все шаблоны</option>
                      {reportTemplateOptions.map((template) => (
                        <option key={template} value={template}>
                          {template}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="reports-filter reports-filter--team">
                    <select
                      value={reportTeam}
                      onChange={(event) => setReportTeam(event.target.value)}
                    >
                      <option value="all">Все команды</option>
                      {reportTeamOptions.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="reports-dashboard__stats">
                  <article className="reports-stat-card">
                    <header>
                      <p>Средняя длительность</p>
                      <Clock3 size={24} />
                    </header>
                    <strong>
                      {formatDurationLong(reportStats.averageDurationMs)}
                    </strong>
                    <p className="reports-stat-card__trend reports-stat-card__trend--up">
                      <ArrowUpRight size={20} />
                      <span>{reportTrend.duration}</span>
                    </p>
                  </article>

                  <article className="reports-stat-card">
                    <header>
                      <p>Активные машины</p>
                      <Monitor size={24} />
                    </header>
                    <strong>{`${reportStats.activeMachines}/${reportStats.totalMachines}`}</strong>
                    <p className="reports-stat-card__trend reports-stat-card__trend--up">
                      <ArrowUpRight size={20} />
                      <span>{reportTrend.machines}</span>
                    </p>
                  </article>

                  <article className="reports-stat-card">
                    <header>
                      <p>Число ошибок</p>
                      <AlertTriangle size={24} />
                    </header>
                    <strong>{`${reportStats.errorTasks}/${reportStats.totalTasks}`}</strong>
                    <p className="reports-stat-card__trend reports-stat-card__trend--down">
                      <ArrowDownRight size={20} />
                      <span>{reportTrend.errors}</span>
                    </p>
                  </article>

                  <article className="reports-stat-card">
                    <header>
                      <p>Процент успеха</p>
                      <Percent size={24} />
                    </header>
                    <strong>{`${reportStats.successRate.toFixed(1)}%`}</strong>
                    <p className="reports-stat-card__trend reports-stat-card__trend--up">
                      <ArrowUpRight size={20} />
                      <span>{reportTrend.success}</span>
                    </p>
                  </article>
                </div>

                <section className="reports-table-card">
                  <header className="reports-table-card__header">
                    <h2>Сводка по шаблонам и машинам с drill-down</h2>

                    <span className="reports-table-card__caption">Поиск выполняется через верхнюю панель</span>
                  </header>

                  <table className="reports-table-card__grid">
                    <thead>
                      <tr>
                        <th>Шаблон или задача</th>
                        <th>Всего задач</th>
                        <th>Успешно</th>
                        <th>Ошибки</th>
                        <th>Ср. длительность</th>
                        <th>Действия</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportSummaryRows.length ? (
                        reportSummaryRows.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <span className="reports-table-card__template">
                                <img
                                  src={getReportTemplateIcon(row.title)}
                                  className={
                                    row.title.trim().toLowerCase() === "db-sync"
                                      ? "reports-table-card__template-icon--sync"
                                      : undefined
                                  }
                                  alt=""
                                  aria-hidden="true"
                                />
                                <span>{row.title}</span>
                              </span>
                            </td>
                            <td>{row.totalTasks}</td>
                            <td className="reports-table-card__success">
                              {row.successCount}
                            </td>
                            <td className="reports-table-card__error">
                              {row.errorCount}
                            </td>
                            <td>{formatDurationCompact(row.avgDurationMs)}</td>
                            <td>
                              <button
                                type="button"
                                className="reports-table-card__action"
                                onClick={() => {
                                  navigate(
                                    row.actionLabel === "Смотреть логи"
                                      ? logsPath()
                                      : workspacePath("tasks"),
                                  );
                                }}
                              >
                                {row.actionLabel}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>Нет данных для выбранных фильтров</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                <span className="reports-dashboard__avatar" aria-hidden="true">
                  <img src="/imya.png" alt="" />
                </span>
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
            <section className="profile-dashboard" aria-label="Профиль">
              {renderWorkspaceTopbar()}

              <div className="profile-dashboard__body">
                <aside className="profile-nav" aria-label="Разделы профиля">
                  <h2>Профиль</h2>
                  <div className="profile-nav__items">
                    {profileSections.map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        className={
                          profileSection === section.key
                            ? "profile-nav__item profile-nav__item--active"
                            : "profile-nav__item"
                        }
                        onClick={() => setProfileSection(section.key)}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </aside>

                <div className="profile-main">
                  {profileSection === "general" ? (
                    <section className="profile-card profile-card--general">
                      <header className="profile-card__header">
                        <h3>Основная информация</h3>
                        <p>Управление личными данными и настройками профиля</p>
                      </header>

                      <div className="profile-main-info">
                        <span className="profile-avatar" aria-hidden="true">
                          {profileAvatarUrl ? (
                            <img
                              src={profileAvatarUrl}
                              alt=""
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                        <div className="profile-main-info__controls">
                          <button
                            type="button"
                            className="profile-main-info__add"
                            onClick={() =>
                              profileAvatarInputRef.current?.click()
                            }
                          >
                            Добавить +
                          </button>
                          <input
                            ref={profileAvatarInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            className="profile-main-info__file"
                            onChange={handleProfileAvatarChange}
                          />
                          <span className="profile-main-info__hint">
                            Формат JPG, PNG
                          </span>
                        </div>
                      </div>

                      <div className="profile-fields profile-fields--two">
                        <label className="profile-field">
                          <span>Имя</span>
                          <input
                            type="text"
                            value={profileFirstName}
                            onChange={(event) =>
                              setProfileFirstName(event.target.value)
                            }
                            placeholder="Имя"
                          />
                        </label>

                        <label className="profile-field">
                          <span>Фамилия</span>
                          <input
                            type="text"
                            value={profileLastName}
                            onChange={(event) =>
                              setProfileLastName(event.target.value)
                            }
                            placeholder="Фамилия"
                          />
                        </label>
                      </div>

                      <label className="profile-field">
                        <span>Электронная почта</span>
                        <input
                          type="email"
                          value={profileDashboard?.email ?? ""}
                          readOnly
                        />
                      </label>
                    </section>
                  ) : null}

                  {profileSection === "security" ? (
                    <section className="profile-card profile-card--security">
                      <header className="profile-card__header">
                        <h3>Безопасность</h3>
                        <p>Пароль и двухфакторная аутентификация</p>
                      </header>

                      <label className="profile-field">
                        <span>Текущий пароль</span>
                        <input type="password" value="********" readOnly />
                      </label>

                      <div className="profile-security-row">
                        <div>
                          <div className="profile-security-row__title-line">
                            <strong>Двухфакторная аутентификация</strong>
                            {profileDashboard?.twoFactorEnabled ? (
                              <span className="profile-security-row__badge">
                                Подключена
                              </span>
                            ) : null}
                          </div>
                          <p>
                            {profileDashboard?.twoFactorEnabled
                              ? `Подключена (${profileDashboard.enabledTwoFactorMethods.join(", ") || "метод не указан"})`
                              : "Не подключена"}
                          </p>
                        </div>

                        <button
                          type="button"
                          className={
                            profileDashboard?.twoFactorEnabled
                              ? "profile-security-row__action profile-security-row__action--danger"
                              : "profile-security-row__action"
                          }
                        >
                          {profileDashboard?.twoFactorEnabled
                            ? "Отключить"
                            : "Подключить"}
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {profileSection === "sessions" ? (
                    <section className="profile-card profile-card--sessions">
                      <header className="profile-card__header">
                        <h3>Активные сессии</h3>
                        <p>
                          Показаны устройства, на которых выполнен вход в Ваш
                          аккаунт.
                        </p>
                      </header>

                      <div className="profile-sessions-list">
                        {profileSessions.length ? (
                          profileSessions.map((session) => (
                            <article
                              key={session.id}
                              className="profile-session-row profile-session-row--current"
                            >
                              <div className="profile-session-row__content">
                                <span
                                  className="profile-session-row__icon profile-session-row__icon--current"
                                  aria-hidden="true"
                                >
                                  {session.deviceLabel === "Браузер" ? (
                                    <Smartphone size={20} />
                                  ) : (
                                    <Laptop size={20} />
                                  )}
                                </span>
                                <div className="profile-session-row__meta">
                                  <div className="profile-session-row__title-line">
                                    <strong>{session.deviceLabel}</strong>
                                    {session.isCurrent ? (
                                      <span className="profile-session-row__current">
                                        На этом устройстве
                                      </span>
                                    ) : null}
                                  </div>
                                  <p>{session.description}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="profile-session-row__terminate"
                                onClick={handleTerminateProfileSession}
                              >
                                Завершить
                              </button>
                            </article>
                          ))
                        ) : (
                          <p className="profile-sessions-list__empty">
                            Нет активных сессий
                          </p>
                        )}
                      </div>
                    </section>
                  ) : null}

                  {profileSection === "notifications" ? (
                    <section className="profile-card profile-card--notifications">
                      <header className="profile-card__header">
                        <h3>Настройки уведомлений</h3>
                        <p>Укажите уведомления, которые нужно отправлять</p>
                      </header>

                      <div className="profile-notifications">
                        <label>
                          <span>Выполнение задачи</span>
                          <input
                            type="checkbox"
                            checked={profileNotifications.taskCompleted}
                            onChange={(event) =>
                              setProfileNotifications((current) => ({
                                ...current,
                                taskCompleted: event.target.checked,
                              }))
                            }
                          />
                        </label>

                        <label>
                          <span>Предупреждение</span>
                          <input
                            type="checkbox"
                            checked={profileNotifications.warnings}
                            onChange={(event) =>
                              setProfileNotifications((current) => ({
                                ...current,
                                warnings: event.target.checked,
                              }))
                            }
                          />
                        </label>

                        <label>
                          <span>Отчет</span>
                          <input
                            type="checkbox"
                            checked={profileNotifications.reports}
                            onChange={(event) =>
                              setProfileNotifications((current) => ({
                                ...current,
                                reports: event.target.checked,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </section>
                  ) : null}

                  <footer className="profile-actions">
                    <button type="button" className="profile-actions__cancel">
                      Отмена
                    </button>
                    <button type="button" className="profile-actions__save">
                      Сохранить
                    </button>
                  </footer>
                </div>
              </div>
            </section>
          ) : selectedMachine ? (
            <section className="machine-details" aria-label="Карточка машины">
              {renderWorkspaceTopbar()}

              <div className="machine-details__body">
                <MachineWorkspace
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

              {isAddMachineRoute ? (
                <section className="machine-pairing-card" aria-label="Добавление машины">
                  <div className="machine-pairing-card__copy">
                    <h2>Добавление машины</h2>
                    <p>
                      Выполните на целевой машине команду <code>predict pair --backend-url https://nerior.store</code>,
                      затем подтвердите появившийся device code здесь.
                    </p>
                  </div>

                  <form className="machine-pairing-card__form" onSubmit={handleAddMachineSubmit}>
                    <label className="machine-pairing-card__field">
                      <span>Device code</span>
                      <input
                        type="text"
                        value={addMachineCode}
                        onChange={(event) => setAddMachineCode(event.target.value)}
                        placeholder="Например, 761861"
                        autoComplete="one-time-code"
                      />
                    </label>

                    <label className="machine-pairing-card__field">
                      <span>Имя машины</span>
                      <input
                        type="text"
                        value={addMachineDisplayName}
                        onChange={(event) =>
                          setAddMachineDisplayName(event.target.value)
                        }
                        placeholder="Необязательно"
                      />
                    </label>

                    <div className="machine-pairing-card__actions">
                      <button
                        type="button"
                        className="machine-pairing-card__secondary"
                        onClick={() => {
                          setAddMachineCode("");
                          setAddMachineDisplayName("");
                        }}
                      >
                        Сбросить
                      </button>
                      <button type="submit" className="machine-pairing-card__primary">
                        Подтвердить
                      </button>
                    </div>
                  </form>
                </section>
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
                        {section.cards.map((card) => (
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
                        ))}
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
                На linux доступен только systemd сервис без графического
                интерфейса
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
                <select
                  value={taskMachineId}
                  onChange={(event) => setTaskMachineId(event.target.value)}
                >
                  <option value="">Выбрать</option>
                  {machineDashboardCards.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {getMachineDisplayName(machine)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="task-create-modal__field">
                <span>Команда</span>
                <select
                  value={taskCommand}
                  onChange={(event) => setTaskCommand(event.target.value)}
                  disabled={!taskMachineId || !taskTemplateOptions.length}
                >
                  <option value="">
                    {taskMachineId ? "Выбрать" : "Сначала выберите машину"}
                  </option>
                  {taskTemplateOptions.map((template) => (
                    <option key={template.templateKey} value={template.templateKey}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedTaskTemplate ? (
                <div className="task-create-modal__params">
                  {selectedTaskTemplate.parameters.map((parameter) => (
                    <label
                      key={parameter.key}
                      className="task-create-modal__field"
                    >
                      <span>{parameter.label}</span>
                      <select
                        value={taskParamValues[parameter.key] ?? ""}
                        onChange={(event) =>
                          setTaskParamValues((current) => ({
                            ...current,
                            [parameter.key]: event.target.value,
                          }))
                        }
                      >
                        {parameter.allowedValues.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
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
            <p className="brand-block__tagline">Любая валюта под рукой</p>
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
                      onChange={(event) =>
                        setVerificationCode(event.target.value)
                      }
                      placeholder="Введите 6-значный код"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>
                </label>

                <button className="submit-button" type="submit">
                  <span>Подтвердить вход</span>
                </button>
              </form>

              <p className="confirm-panel__resend">
                <span>Не приходит код?</span>{" "}
                <button type="button">Отправить еще раз</button>
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
                <a href="#terms">Условиями Пользования</a> и{" "}
                <a href="#privacy">Политикой Конфиденциальности</a>
              </p>
            </section>
          ) : (
            <section className="auth-panel">
              <div className="auth-panel__heading">
                <h1>
                  {authMode === "login" ? "Вход в аккаунт" : "Регистрация"}
                </h1>
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
                      autoComplete={
                        authMode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                    />
                    <button
                      type="button"
                      className="field__toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Скрыть пароль" : "Показать пароль"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {authMode === "register" && (
                  <>
                    <label className="field">
                      <span>Повторите пароль</span>
                      <div className="field__control field__control--password">
                        <Lock size={16} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="field__toggle"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Скрыть пароль"
                              : "Показать пароль"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="consent-row">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(event) =>
                          setAcceptTerms(event.target.checked)
                        }
                      />
                      <span>
                        Я даю согласие на обработку персональных данных
                      </span>
                    </label>
                  </>
                )}

                <button className="submit-button" type="submit">
                  <span>
                    {authMode === "login" ? "Войти" : "Зарегистрироваться"}
                  </span>
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
