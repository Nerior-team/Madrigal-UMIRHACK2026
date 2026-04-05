import { useEffect, useMemo, useRef, useState } from "react";
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
  Plus,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Laptop,
  X,
} from "lucide-react";
import {
  api,
  type LogsDashboardResponse,
  type ProfileDashboardResponse,
  type ResultsDashboardResponse,
  type ReportsDashboardResponse,
} from "./core";

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
type MachineDetailTab = "dashboard" | "logs" | "tasks" | "results";
type ProfileSection = "general" | "security" | "sessions" | "notifications";

type MachineCardStatus = "online" | "running" | "offline";

type MachineDashboardCard = {
  id: string;
  machine: string;
  os: string;
  heartbeat: string;
  owner: string;
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

type TaskCard = {
  taskNumber: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  serverNumber: string;
  resultText: string;
  resultColor: "green" | "yellow" | "red";
  status: "completed" | "in_progress" | "error";
};

type TaskFilterStatus = "all" | TaskCard["status"];

type AccessRoleTone = "viewer" | "admin" | "operator" | "owner";
type AccessStatusTone = "active" | "pending";

type AccessSummaryCard = {
  id: string;
  title: string;
  value: string;
  tone?: "default" | "highlight";
};

type AccessUserRow = {
  id: string;
  email: string;
  role: string;
  roleTone: AccessRoleTone;
  resource: string;
  status: string;
  statusTone: AccessStatusTone;
  action: string;
};

type AccessActivityItem = {
  id: string;
  actor: string;
  email: string;
  role: string;
  time: string;
  actionText: string;
};

type LogStatusTone = "success" | "warning" | "critical";
type LogEntry = LogsDashboardResponse["entries"][number];
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

type ResultStatusTone = "success" | "error" | "cancelled";

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

const taskStatusSections = [
  { key: "completed", label: "Завершенные" },
  { key: "in_progress", label: "В процессе" },
  { key: "error", label: "Ошибки" },
] as const;

const machineDetailTabs: Array<{ key: MachineDetailTab; label: string }> = [
  { key: "dashboard", label: "Дашборд" },
  { key: "logs", label: "Логи" },
  { key: "tasks", label: "Задачи" },
  { key: "results", label: "Результаты" },
];

const machineStatusLabelByStatus: Record<MachineCardStatus, string> = {
  online: "Онлайн",
  running: "Выполняет задачу",
  offline: "Оффлайн",
};

function getMachineDisplayName(card: MachineDashboardCard): string {
  if (card.machine.includes("№")) {
    return card.machine;
  }

  const numericId = card.id.replace(/\D/g, "");
  return numericId
    ? `${card.machine} №${numericId}`
    : `${card.machine} ${card.id}`;
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
  actions: [string, string];
  activeActionIndex: number;
  hint: string;
}> = [
  {
    id: "windows",
    title: "Windows",
    versions: ["Windows 10 x64", "Windows 11 x64"],
    actions: ["daemon сервис", "Desktop приложение"],
    activeActionIndex: 1,
    hint: "Desktop приложение включает в себя daemon сервис и графический интерфейс",
  },
  {
    id: "linux",
    title: "Linux",
    versions: ["Ubuntu 22.04+ x86_64", "Debian 12+ x86_64"],
    actions: ["Инструкция по установке", "Установить архив"],
    activeActionIndex: 1,
    hint: "На Linux доступен только systemd сервис без графического интерфейса",
  },
];

const REPORT_PERIOD_WINDOW_MS: Record<ReportPeriod, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  all: Number.POSITIVE_INFINITY,
};

const ACCESS_ROWS_LIMIT = 10;

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
  if (cardId === "windows" && actionLabel === "daemon сервис") {
    return WINDOWS_DAEMON_INSTALL_URL;
  }

  if (cardId === "linux" && actionLabel === "Установить архив") {
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
  const [screen, setScreen] = useState<AppScreen>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("machines");

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
  const [accessUserRows, setAccessUserRows] = useState<AccessUserRow[]>([]);
  const [accessActivityItems, setAccessActivityItems] = useState<
    AccessActivityItem[]
  >([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logStreamLines, setLogStreamLines] = useState<string[]>([]);
  const [logsSearchQuery, setLogsSearchQuery] = useState("");
  const [resultsStatusFilter, setResultsStatusFilter] = useState<
    "all" | ResultStatusTone
  >("all");
  const [resultsMachineFilter, setResultsMachineFilter] = useState("all");
  const [resultsCommandFilter, setResultsCommandFilter] = useState("all");
  const [resultsDateFilter, setResultsDateFilter] = useState("all");
  const [resultsSearchQuery, setResultsSearchQuery] = useState("");
  const [resultHistoryRows, setResultHistoryRows] = useState<
    ResultHistoryRow[]
  >([]);
  const [reportTasks, setReportTasks] = useState<ReportTaskItem[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("day");
  const [reportMachine, setReportMachine] = useState("all");
  const [reportTemplate, setReportTemplate] = useState("all");
  const [reportTeam, setReportTeam] = useState("all");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
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
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  );
  const [machineDetailTab, setMachineDetailTab] =
    useState<MachineDetailTab>("dashboard");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLinuxInstallGuideOpen, setIsLinuxInstallGuideOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [taskName, setTaskName] = useState("");
  const [taskCommand, setTaskCommand] = useState("");
  const [taskParam1, setTaskParam1] = useState("");
  const [taskParam2, setTaskParam2] = useState("");
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

  const profileDisplayName = useMemo(() => {
    if (!profileDashboard) return "Имя Фамилия";
    const trimmed = profileDashboard.fullName.trim();
    return trimmed || "Имя Фамилия";
  }, [profileDashboard]);

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

  const visibleLogEntries = useMemo(() => {
    const byTone =
      logFilterTone === "all"
        ? logEntries
        : logEntries.filter((entry) => entry.tone === logFilterTone);

    const normalizedQuery = logsSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return byTone;

    return byTone.filter((entry) =>
      [entry.id, entry.machine, entry.action, entry.email, entry.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [logEntries, logFilterTone, logsSearchQuery]);

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

    const normalizedSearch = reportSearchQuery.trim().toLowerCase();
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
      .filter((row) => {
        if (!normalizedSearch) return true;
        return row.title.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }, [filteredReportTasks, reportSearchQuery]);

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
          (card) => card.status === section.key,
        ),
      })),
    [machineDashboardCards],
  );

  const taskStatusGroups = useMemo(
    () =>
      taskStatusSections.map((section) => ({
        ...section,
        cards: taskCards.filter((task) => task.status === section.key),
      })),
    [taskCards],
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

  const visibleAccessRows = useMemo(
    () => accessUserRows.slice(0, ACCESS_ROWS_LIMIT),
    [accessUserRows],
  );

  const resultsMachineOptions = useMemo(
    () =>
      [...new Set(resultHistoryRows.map((row) => row.machine))].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    [resultHistoryRows],
  );

  const resultsCommandOptions = useMemo(
    () =>
      [...new Set(resultHistoryRows.map((row) => row.command))].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    [resultHistoryRows],
  );

  const visibleResultRows = useMemo(() => {
    const normalizedSearch = resultsSearchQuery.trim().toLowerCase();
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    return resultHistoryRows.filter((row) => {
      const byStatus =
        resultsStatusFilter === "all" || row.statusTone === resultsStatusFilter;
      const byMachine =
        resultsMachineFilter === "all" || row.machine === resultsMachineFilter;
      const byCommand =
        resultsCommandFilter === "all" || row.command === resultsCommandFilter;
      const byDate =
        resultsDateFilter === "all" ||
        (resultsDateFilter === "today" &&
          (() => {
            const resultDate = new Date(row.resultAtIso);
            return (
              !Number.isNaN(resultDate.getTime()) &&
              resultDate.getFullYear() === todayY &&
              resultDate.getMonth() === todayM &&
              resultDate.getDate() === todayD
            );
          })());
      const bySearch =
        !normalizedSearch ||
        [row.title, row.machine, row.command, row.resultAt, row.statusLabel]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return byStatus && byMachine && byCommand && byDate && bySearch;
    });
  }, [
    resultsCommandFilter,
    resultsDateFilter,
    resultsMachineFilter,
    resultHistoryRows,
    resultsSearchQuery,
    resultsStatusFilter,
  ]);

  useEffect(() => {
    if (screen !== "machines") return;

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
      if (workspaceTab === "tasks") {
        const tasks = await apiClient.getTasks();
        setTaskCards(tasks);
      }
    };

    const loadAccessDashboard = async () => {
      if (workspaceTab !== "access") return;

      const accessDashboard = await apiClient.getAccessDashboard();
      setAccessSummaryCards(accessDashboard.metrics);
      setAccessUserRows(accessDashboard.users);
      setAccessActivityItems(accessDashboard.activity);
    };

    const loadLogsDashboard = async () => {
      if (workspaceTab !== "logs") return;

      const logsDashboard = await apiClient.getLogsDashboard();
      setLogEntries(logsDashboard.entries);
      setLogStreamLines(logsDashboard.streamLines);
    };

    const loadReportsDashboard = async () => {
      if (workspaceTab !== "reports") return;

      const reportsDashboard = await apiClient.getReportsDashboard();
      setReportTasks(reportsDashboard.tasks);
    };

    const loadResultsDashboard = async () => {
      if (workspaceTab !== "results") return;

      const resultsDashboard = await apiClient.getResultsDashboard();
      setResultHistoryRows(resultsDashboard.rows);
    };

    const loadProfileDashboard = async () => {
      const profile = await apiClient.getProfileDashboard();
      setProfileDashboard(profile);
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
      setAccessUserRows([]);
      setAccessActivityItems([]);
    });
    loadLogsDashboard().catch(() => {
      setLogEntries([]);
      setLogStreamLines([]);
    });
    loadReportsDashboard().catch(() => {
      setReportTasks([]);
    });
    loadResultsDashboard().catch(() => {
      setResultHistoryRows([]);
    });
    loadProfileDashboard().catch(() => {
      setProfileDashboard(null);
    });
  }, [screen, workspaceTab]);

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

  const openCreateTaskModal = () => {
    setIsCreateTaskOpen(true);
  };

  const handleHomeActionClick = (label: string) => {
    const normalized = label.trim().toLowerCase();

    if (normalized.includes("создать задачу")) {
      openCreateTaskModal();
      return;
    }

    if (normalized.includes("открыть логи")) {
      setWorkspaceTab("logs");
      setSelectedMachineId(null);
      setMachineDetailTab("dashboard");
      return;
    }

    if (normalized.includes("добавить агента")) {
      setWorkspaceTab("machines");
      setSelectedMachineId(null);
      setMachineDetailTab("dashboard");
      return;
    }

    if (normalized.includes("управление")) {
      setWorkspaceTab("access");
      setSelectedMachineId(null);
      setMachineDetailTab("dashboard");
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

  const handleTerminateProfileSession = () => {
    setIsCreateTaskOpen(false);
    setIsLinuxInstallGuideOpen(false);
    setAuthChallengeId(null);
    setAuthMode("login");
    setScreen("auth");
  };

  const handleCreateTaskSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeCreateTaskModal();
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
        <aside
          className={
            workspaceTab === "home"
              ? "machines-sidebar machines-sidebar--home"
              : workspaceTab === "tasks"
                ? "machines-sidebar machines-sidebar--tasks"
                : workspaceTab === "results"
                  ? "machines-sidebar machines-sidebar--results"
                  : workspaceTab === "logs"
                    ? "machines-sidebar machines-sidebar--logs"
                    : workspaceTab === "access"
                      ? "machines-sidebar machines-sidebar--access"
                      : workspaceTab === "reports"
                        ? "machines-sidebar machines-sidebar--reports"
                        : workspaceTab === "install"
                          ? "machines-sidebar machines-sidebar--install"
                          : workspaceTab === "profile"
                            ? "machines-sidebar machines-sidebar--profile"
                            : "machines-sidebar machines-sidebar--machines"
          }
        >
          <span className="machines-sidebar__active-strip" aria-hidden="true" />
          <div className="machines-logo">
            <img
              src="/logo.png"
              alt="Predict MV logo"
              className="machines-logo__mark"
            />
            <strong>PREDICT MV</strong>
          </div>

          <nav className="machines-nav" aria-label="Навигация">
            {menuItems.map((item) => {
              const isActive = item.tab === workspaceTab;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={
                    isActive
                      ? "machines-nav__item active"
                      : "machines-nav__item"
                  }
                  onClick={() => {
                    if (item.tab) {
                      setWorkspaceTab(item.tab);
                      setSelectedMachineId(null);
                      setMachineDetailTab("dashboard");
                    }
                  }}
                >
                  <img
                    src={item.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="machines-nav__icon"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className={
              workspaceTab === "profile"
                ? "machines-profile machines-profile--active"
                : "machines-profile"
            }
            onClick={() => {
              setWorkspaceTab("profile");
              setSelectedMachineId(null);
              setMachineDetailTab("dashboard");
              setProfileSection("general");
            }}
          >
            <img src="/imya.png" alt="" aria-hidden="true" />
            <span>{profileDisplayName}</span>
          </button>

          <button
            type="button"
            className={
              workspaceTab === "install"
                ? "machines-profile machines-install machines-profile--active"
                : "machines-profile machines-install"
            }
            onClick={() => {
              setWorkspaceTab("install");
              setSelectedMachineId(null);
              setMachineDetailTab("dashboard");
            }}
          >
            <img src="/download.png" alt="" aria-hidden="true" />
            <span>Установка</span>
          </button>
        </aside>

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
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

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
                        {homeActionCards.map((card) => (
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
                          {homeTaskRows.map((row, index) => (
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
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

              <div className="tasks-body">
                <p className="tasks-dashboard__breadcrumb">
                  <img src="/dom.png" alt="" aria-hidden="true" />
                  <img
                    src="/strelka.png?v=2"
                    alt=""
                    aria-hidden="true"
                    className="tasks-dashboard__breadcrumb-arrow"
                  />
                  <span>Задачи</span>
                </p>

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
                    className={`tasks-dashboard__chip ${taskFilterStatus === "error" ? "tasks-dashboard__chip--active" : ""}`}
                    onClick={() => setTaskFilterStatus("error")}
                  >
                    Ошибки
                  </button>

                  <div className="tasks-dashboard__icons">
                    <button
                      type="button"
                      className="tasks-dashboard__icon-btn"
                      aria-label="Фильтр"
                    >
                      <img src="/up.png" alt="" aria-hidden="true" />
                      <img src="/down.png" alt="" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className="tasks-dashboard__icon-btn"
                      aria-label="Поиск"
                    >
                      <Search size={20} />
                    </button>
                  </div>
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
                            task.status === "in_progress"
                              ? "Убить"
                              : "Повторить";
                          const primaryActionLabel =
                            task.status === "in_progress"
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
                                  <span>Сервер №{task.serverNumber}</span>
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
                                >
                                  {secondaryActionLabel}
                                </button>
                                <button
                                  type="button"
                                  className="task-card__btn task-card__btn--primary"
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
              </div>
            </section>
          ) : workspaceTab === "results" ? (
            <section className="results-dashboard" aria-label="Результаты">
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

              <div className="results-dashboard__body">
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

                    <label className="results-table-card__search">
                      <Search size={20} />
                      <input
                        type="text"
                        placeholder="Поиск по таблице..."
                        value={resultsSearchQuery}
                        onChange={(event) =>
                          setResultsSearchQuery(event.target.value)
                        }
                      />
                    </label>
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
                            <td>{row.title}</td>
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
                                  onClick={() => {
                                    setWorkspaceTab("logs");
                                    setSelectedMachineId(null);
                                    setMachineDetailTab("dashboard");
                                  }}
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
              </div>
            </section>
          ) : workspaceTab === "logs" ? (
            <section className="logs-dashboard" aria-label="Логи">
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

              <div className="logs-dashboard__body">
                <header className="logs-dashboard__header">
                  <div>
                    <h1>Логи</h1>
                    <p>История системных событий по задачам и машинам</p>
                  </div>
                </header>

                <div className="logs-dashboard__filters">
                  <div className="logs-dashboard__chips">
                    <button
                      type="button"
                      className={`logs-dashboard__chip ${logFilterTone === "all" ? "logs-dashboard__chip--active" : ""}`}
                      onClick={() => setLogFilterTone("all")}
                    >
                      Все ({logEntries.length})
                    </button>
                    <button
                      type="button"
                      className={`logs-dashboard__chip ${logFilterTone === "success" ? "logs-dashboard__chip--active" : ""}`}
                      onClick={() => setLogFilterTone("success")}
                    >
                      Завершено ({logStatusStats.success})
                    </button>
                    <button
                      type="button"
                      className={`logs-dashboard__chip ${logFilterTone === "warning" ? "logs-dashboard__chip--active" : ""}`}
                      onClick={() => setLogFilterTone("warning")}
                    >
                      Требует внимания ({logStatusStats.warning})
                    </button>
                    <button
                      type="button"
                      className={`logs-dashboard__chip ${logFilterTone === "critical" ? "logs-dashboard__chip--active" : ""}`}
                      onClick={() => setLogFilterTone("critical")}
                    >
                      Критично ({logStatusStats.critical})
                    </button>
                  </div>

                  <label className="logs-dashboard__search">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Поиск по логам..."
                      value={logsSearchQuery}
                      onChange={(event) =>
                        setLogsSearchQuery(event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="logs-dashboard__content">
                  <section className="logs-table" aria-label="Таблица логов">
                    <table className="logs-table__grid">
                      <thead>
                        <tr>
                          <th>ID события</th>
                          <th>Машина</th>
                          <th>Действие</th>
                          <th>Пользователь</th>
                          <th>Статус</th>
                          <th>Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleLogEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.id}</td>
                            <td>{entry.machine}</td>
                            <td>{entry.action}</td>
                            <td>{entry.email}</td>
                            <td>
                              <span
                                className={`logs-table__status logs-table__status--${entry.tone}`}
                              >
                                {entry.status}
                              </span>
                            </td>
                            <td>{entry.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <footer className="logs-table__footer">
                      <span>
                        Показано {visibleLogEntries.length} из{" "}
                        {logEntries.length}
                      </span>
                      <span>Событий в потоке: {logStreamLines.length}</span>
                    </footer>
                  </section>

                  <aside className="logs-stream" aria-label="Поток логов">
                    <header className="logs-stream__header">
                      <h2>Live stream</h2>
                      <button
                        type="button"
                        className={
                          logsAutoScrollEnabled
                            ? "logs-stream__toggle logs-stream__toggle--active"
                            : "logs-stream__toggle"
                        }
                        onClick={() =>
                          setLogsAutoScrollEnabled((current) => !current)
                        }
                      >
                        {logsAutoScrollEnabled
                          ? "Autoscroll: On"
                          : "Autoscroll: Off"}
                      </button>
                    </header>

                    <div
                      className="logs-stream__console"
                      role="log"
                      aria-live="polite"
                    >
                      {logStreamLines.map((line, index) => (
                        <p key={`${line}_${index}`}>{line}</p>
                      ))}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          ) : workspaceTab === "access" ? (
            <section className="access-dashboard" aria-label="Доступ">
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

              <div className="access-dashboard__body">
                <header className="access-dashboard__header">
                  <h1>Управление доступом</h1>
                  <button type="button" className="access-dashboard__invite">
                    <span>Отправить приглашение</span>
                    <img src="/plus.png" alt="" aria-hidden="true" />
                  </button>
                </header>

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
                                    disabled={row.action === "-"}
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
                      <button type="button">Показать все</button>
                    </footer>
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
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

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

                    <label className="reports-table-card__search">
                      <Search size={20} />
                      <input
                        type="text"
                        placeholder="Поиск по таблице..."
                        value={reportSearchQuery}
                        onChange={(event) =>
                          setReportSearchQuery(event.target.value)
                        }
                      />
                    </label>
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
                                  setWorkspaceTab(
                                    row.actionLabel === "Смотреть логи"
                                      ? "logs"
                                      : "tasks",
                                  );
                                  setSelectedMachineId(null);
                                  setMachineDetailTab("dashboard");
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
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

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
                            className={
                              index === card.activeActionIndex
                                ? "install-card__action install-card__action--active"
                                : "install-card__action"
                            }
                            onClick={() => {
                              if (
                                card.id === "linux" &&
                                action === "Инструкция по установке"
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
              <header className="home-topbar reports-topbar">
                <label className="home-search reports-topbar__search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

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
              <header className="home-topbar">
                <label className="home-search">
                  <Search size={24} />
                  <input type="text" placeholder="Поиск" />
                </label>

                <div className="home-topbar__actions">
                  <button
                    type="button"
                    className="machines-bell"
                    aria-label="Уведомления"
                  >
                    <img src="/uved.png" alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="home-new-task"
                    onClick={openCreateTaskModal}
                  >
                    <Plus size={24} />
                    <span>Создать задачу</span>
                  </button>
                </div>
              </header>

              <div className="machine-details__body">
                <p className="machine-details__breadcrumb">
                  <img src="/dom.png" alt="" aria-hidden="true" />
                  <img
                    src="/strelka.png?v=2"
                    alt=""
                    aria-hidden="true"
                    className="machine-details__breadcrumb-arrow"
                  />
                  <button
                    type="button"
                    className="machine-details__breadcrumb-link"
                    onClick={() => setSelectedMachineId(null)}
                  >
                    Машины
                  </button>
                  <img
                    src="/strelka.png?v=2"
                    alt=""
                    aria-hidden="true"
                    className="machine-details__breadcrumb-arrow"
                  />
                  <span>{getMachineDisplayName(selectedMachine)}</span>
                </p>

                <header className="machine-details__header">
                  <h1>{getMachineDisplayName(selectedMachine)}</h1>
                  <p className="machine-details__status">
                    <span
                      className={`machine-details__status-dot machine-details__status-dot--${selectedMachine.status}`}
                    />
                    <span>
                      {machineStatusLabelByStatus[selectedMachine.status]}
                    </span>
                  </p>
                </header>

                <div className="machine-details__tabs-row">
                  <div className="machine-details__tabs">
                    {machineDetailTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={
                          tab.key === machineDetailTab
                            ? "machine-details__tab machine-details__tab--active"
                            : "machine-details__tab"
                        }
                        onClick={() => setMachineDetailTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="machine-details__tabs-icons">
                    <button
                      type="button"
                      className="machine-details__icon-btn"
                      aria-label="Фильтр"
                    >
                      <img src="/up.png" alt="" aria-hidden="true" />
                      <img src="/down.png" alt="" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="machine-details__icon-btn"
                      aria-label="Поиск"
                    >
                      <Search size={20} />
                    </button>
                  </div>
                </div>

                {machineDetailTab === "dashboard" ? (
                  <>
                    <section className="machine-details__panel">
                      <h2>Обзор</h2>
                      <div className="machine-details__overview-grid">
                        <article className="machine-details__overview-card">
                          <p className="machine-details__overview-label">ОС</p>
                          <p className="machine-details__overview-value">
                            {selectedMachine.os}
                          </p>
                        </article>

                        <article className="machine-details__overview-card">
                          <p className="machine-details__overview-label">
                            Создатель машины
                          </p>
                          <p className="machine-details__overview-value machine-details__overview-value--accent">
                            {selectedMachine.owner}
                          </p>
                        </article>

                        <article className="machine-details__overview-card">
                          <p className="machine-details__overview-label">
                            Администраторы машины
                          </p>
                          <div className="machine-details__admins-list">
                            <p className="machine-details__overview-value machine-details__overview-value--accent">
                              {selectedMachine.owner}
                            </p>
                          </div>
                        </article>

                        <article className="machine-details__overview-card">
                          <p className="machine-details__overview-label">
                            Last heartbeat
                          </p>
                          <p className="machine-details__overview-value machine-details__overview-value--heartbeat">
                            {selectedMachine.heartbeat}
                          </p>
                        </article>
                      </div>
                    </section>

                    <section className="machine-details__panel machine-details__panel--actions">
                      <h2>Быстрые действия</h2>
                      <div className="machine-details__actions-grid">
                        <button
                          type="button"
                          className="machine-details__action"
                        >
                          <span className="machine-details__action-icon">
                            <img
                              src="/updateagent.png"
                              alt=""
                              aria-hidden="true"
                            />
                          </span>
                          <span>Обновить агента</span>
                        </button>

                        <button
                          type="button"
                          className="machine-details__action"
                        >
                          <span className="machine-details__action-icon">
                            <img src="/diagnos.png" alt="" aria-hidden="true" />
                          </span>
                          <span>Запустить диагностику</span>
                        </button>

                        <button
                          type="button"
                          className="machine-details__action"
                        >
                          <span className="machine-details__action-icon">
                            <img src="/eshe.png" alt="" aria-hidden="true" />
                          </span>
                          <span>Что-то еще</span>
                        </button>
                      </div>
                    </section>
                  </>
                ) : (
                  <section className="machine-details__panel machine-details__panel--placeholder">
                    <h2>
                      {
                        machineDetailTabs.find(
                          (tab) => tab.key === machineDetailTab,
                        )?.label
                      }
                    </h2>
                    <p>Раздел в разработке</p>
                  </section>
                )}
              </div>
            </section>
          ) : (
            <section className="machines-dashboard" aria-label="Машины">
              <p className="machines-dashboard__breadcrumb">
                <img src="/dom.png" alt="" aria-hidden="true" />
                <img
                  src="/strelka.png?v=2"
                  alt=""
                  aria-hidden="true"
                  className="machines-dashboard__breadcrumb-arrow"
                />
                <span>Машины</span>
              </p>

              <header className="machines-dashboard__header">
                <div className="machines-dashboard__title-box">
                  <h1>Машины</h1>
                  <p>Всего {machineDashboardCards.length}</p>
                </div>
              </header>

              <div className="machines-dashboard__controls">
                <button type="button" className="machines-dashboard__chip">
                  <span>Linux</span>
                  <span aria-hidden="true">×</span>
                </button>

                <button
                  type="button"
                  className="machines-dashboard__icon-btn"
                  aria-label="Фильтр"
                >
                  <img src="/up.png" alt="" aria-hidden="true" />
                  <img src="/down.png" alt="" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="machines-dashboard__icon-btn"
                  aria-label="Поиск"
                >
                  <Search size={20} />
                </button>
              </div>

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
                              setSelectedMachineId(card.id);
                              setMachineDetailTab("dashboard");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedMachineId(card.id);
                                setMachineDetailTab("dashboard");
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
                <p>Задача №35006</p>
                <h2 id="task-create-title">Создание задачи</h2>
              </div>

              <label className="task-create-modal__field">
                <span>Название</span>
                <input
                  type="text"
                  placeholder="Введите название..."
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                />
              </label>

              <label className="task-create-modal__field">
                <span>Команда</span>
                <select
                  value={taskCommand}
                  onChange={(event) => setTaskCommand(event.target.value)}
                >
                  <option value="">Выбрать</option>
                  <option value="check-port">Проверка порта</option>
                  <option value="check-service">Проверка сервиса</option>
                </select>
              </label>

              <div className="task-create-modal__params">
                <label className="task-create-modal__field">
                  <span>Параметр 1</span>
                  <select
                    value={taskParam1}
                    onChange={(event) => setTaskParam1(event.target.value)}
                  >
                    <option value="">Выбрать</option>
                    <option value="443">Порт 443</option>
                    <option value="308">Порт 308</option>
                    <option value="74978">Порт 74978</option>
                  </select>
                </label>

                <label className="task-create-modal__field">
                  <span>Параметр 2</span>
                  <select
                    value={taskParam2}
                    onChange={(event) => setTaskParam2(event.target.value)}
                  >
                    <option value="">Выбрать</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                </label>
              </div>

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

            <div className="auth-card__preview-copy">
              <p>
                Сюда будет вставляться
                <br />
                меняемое со временем
                <br />
                изображение
                <br />
                (или не меняемое)
              </p>
            </div>
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
