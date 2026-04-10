export type AuthRouteMode =
  | "login"
  | "register"
  | "confirm"
  | "forgot-password"
  | "reset-password";

export type WorkspaceRouteTab =
  | "home"
  | "machines"
  | "tasks"
  | "results"
  | "logs"
  | "access"
  | "reports"
  | "install"
  | "profile";

export type MachineRouteTab = "dashboard" | "tasks" | "results" | "logs";

export type AppRouteModal =
  | { kind: "machine-task-logs"; taskId: string }
  | { kind: "machine-result"; resultId: string }
  | { kind: "task-logs"; taskId: string }
  | { kind: "result-detail"; resultId: string };

export type AuthAppRoute = {
  section: "auth";
  authMode: AuthRouteMode;
};

export type WorkspaceAppRoute = {
  section: "workspace";
  workspaceTab: WorkspaceRouteTab;
  machineId?: string;
  machineTab?: MachineRouteTab;
  logMachineId?: string;
  logTaskId?: string;
  taskId?: string;
  resultId?: string;
  isAddMachine?: boolean;
  profileSection?: "api-keys";
  modal?: AppRouteModal;
};

export type AppRoute = AuthAppRoute | WorkspaceAppRoute;

const AUTH_PATHS: Record<AuthRouteMode, string> = {
  login: "/login",
  register: "/register",
  confirm: "/confirm",
  "forgot-password": "/forgot-password",
  "reset-password": "/reset-password",
};

const WORKSPACE_PATHS: Record<
  Exclude<WorkspaceRouteTab, "home" | "machines" | "profile">,
  string
> = {
  tasks: "/tasks",
  results: "/results",
  logs: "/logs",
  access: "/access",
  reports: "/reports",
  install: "/install",
};

export function authPath(mode: AuthRouteMode): string {
  return AUTH_PATHS[mode];
}

export function workspacePath(tab: WorkspaceRouteTab): string {
  if (tab === "home") return "/dashboard";
  if (tab === "machines") return "/machines";
  if (tab === "profile") return "/profile";
  return WORKSPACE_PATHS[tab];
}

export function machinePath(
  machineId: string,
  tab: MachineRouteTab = "dashboard",
): string {
  const encodedMachineId = encodeURIComponent(machineId);
  if (tab === "dashboard") {
    return `/machines/${encodedMachineId}`;
  }

  return `/machines/${encodedMachineId}/${tab}`;
}

export function addMachinePath(): string {
  return "/machines/add";
}

export function profileApiKeysPath(): string {
  return "/profile/api-keys";
}

export function taskPath(taskId: string): string {
  return `/tasks/${encodeURIComponent(taskId)}`;
}

export function taskLogsPath(taskId: string): string {
  return `/tasks/${encodeURIComponent(taskId)}/logs`;
}

export function resultPath(resultId: string): string {
  return `/results/${encodeURIComponent(resultId)}`;
}

export function machineTaskLogsPath(
  machineId: string,
  taskId: string,
): string {
  return `/machines/${encodeURIComponent(machineId)}/logs/${encodeURIComponent(taskId)}`;
}

export function machineResultPath(
  machineId: string,
  resultId: string,
): string {
  return `/machines/${encodeURIComponent(machineId)}/results/${encodeURIComponent(resultId)}`;
}

export function logsPath(filters?: {
  machineId?: string;
  taskId?: string;
}): string {
  const search = new URLSearchParams();
  if (filters?.machineId) search.set("machineId", filters.machineId);
  if (filters?.taskId) search.set("taskId", filters.taskId);
  const query = search.toString();
  return query ? `/logs?${query}` : "/logs";
}

export function resolveAppRoute(pathname: string, search = ""): AppRoute {
  const normalizedPath =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname || "/";

  if (normalizedPath === "/" || normalizedPath === "/dashboard" || normalizedPath === "/home") {
    return { section: "workspace", workspaceTab: "home" };
  }

  const authEntry = (Object.entries(AUTH_PATHS) as Array<[AuthRouteMode, string]>).find(
    ([, routePath]) => routePath === normalizedPath,
  );
  if (authEntry) {
    return { section: "auth", authMode: authEntry[0] };
  }

  if (normalizedPath === "/machines") {
    return { section: "workspace", workspaceTab: "machines" };
  }

  if (normalizedPath === "/machines/add") {
    return {
      section: "workspace",
      workspaceTab: "machines",
      isAddMachine: true,
    };
  }

  const machineModalMatch = normalizedPath.match(
    /^\/machines\/([^/]+)\/(logs|results)\/([^/]+)$/,
  );
  if (machineModalMatch) {
    const machineId = decodeURIComponent(machineModalMatch[1]);
    const entityId = decodeURIComponent(machineModalMatch[3]);
    return {
      section: "workspace",
      workspaceTab: "machines",
      machineId,
      machineTab: "dashboard",
      modal:
        machineModalMatch[2] === "logs"
          ? { kind: "machine-task-logs", taskId: entityId }
          : { kind: "machine-result", resultId: entityId },
    };
  }

  const machineMatch = normalizedPath.match(
    /^\/machines\/([^/]+)(?:\/(tasks|results|logs))?$/,
  );
  if (machineMatch) {
    return {
      section: "workspace",
      workspaceTab: "machines",
      machineId: decodeURIComponent(machineMatch[1]),
      machineTab: (machineMatch[2] as MachineRouteTab | undefined) ?? "dashboard",
    };
  }

  const taskLogsMatch = normalizedPath.match(/^\/tasks\/([^/]+)\/logs$/);
  if (taskLogsMatch) {
    return {
      section: "workspace",
      workspaceTab: "tasks",
      taskId: decodeURIComponent(taskLogsMatch[1]),
      modal: { kind: "task-logs", taskId: decodeURIComponent(taskLogsMatch[1]) },
    };
  }

  const taskMatch = normalizedPath.match(/^\/tasks\/([^/]+)$/);
  if (taskMatch) {
    return {
      section: "workspace",
      workspaceTab: "tasks",
      taskId: decodeURIComponent(taskMatch[1]),
    };
  }

  const resultMatch = normalizedPath.match(/^\/results\/([^/]+)$/);
  if (resultMatch) {
    return {
      section: "workspace",
      workspaceTab: "results",
      resultId: decodeURIComponent(resultMatch[1]),
      modal: { kind: "result-detail", resultId: decodeURIComponent(resultMatch[1]) },
    };
  }

  if (normalizedPath === "/profile/api-keys") {
    return {
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "api-keys",
    };
  }

  const workspaceEntry = (
    Object.entries(WORKSPACE_PATHS) as Array<
      [Exclude<WorkspaceRouteTab, "home" | "machines" | "profile">, string]
    >
  ).find(([, routePath]) => routePath === normalizedPath);

  if (workspaceEntry) {
    const [workspaceTab] = workspaceEntry;
    if (workspaceTab === "logs") {
      const params = new URLSearchParams(search);
      return {
        section: "workspace",
        workspaceTab,
        logMachineId: params.get("machineId") ?? undefined,
        logTaskId: params.get("taskId") ?? undefined,
      };
    }

    return { section: "workspace", workspaceTab };
  }

  return { section: "workspace", workspaceTab: "machines" };
}
