export type AuthRouteMode = "login" | "register" | "confirm";
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

export type AppRoute =
  | {
      section: "auth";
      authMode: AuthRouteMode;
    }
  | {
      section: "workspace";
      workspaceTab: WorkspaceRouteTab;
      machineId?: string;
      machineTab?: MachineRouteTab;
      logMachineId?: string;
      logTaskId?: string;
    };

const WORKSPACE_PATHS: Record<Exclude<WorkspaceRouteTab, "home" | "machines">, string> =
  {
    tasks: "/tasks",
    results: "/results",
    logs: "/logs",
    access: "/access",
    reports: "/reports",
    install: "/install",
    profile: "/profile",
  };

export function workspacePath(tab: WorkspaceRouteTab): string {
  if (tab === "home") return "/";
  if (tab === "machines") return "/machines";
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

  if (normalizedPath === "/login") {
    return { section: "auth", authMode: "login" };
  }

  if (normalizedPath === "/register") {
    return { section: "auth", authMode: "register" };
  }

  if (normalizedPath === "/confirm") {
    return { section: "auth", authMode: "confirm" };
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

  if (normalizedPath === "/" || normalizedPath === "/home") {
    return { section: "workspace", workspaceTab: "home" };
  }

  if (normalizedPath === "/machines") {
    return { section: "workspace", workspaceTab: "machines" };
  }

  const workspaceEntry = (
    Object.entries(WORKSPACE_PATHS) as Array<[Exclude<WorkspaceRouteTab, "home" | "machines">, string]>
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
