export type PlatformEndpointReference = {
  id: string;
  method: "GET" | "POST";
  path: string;
  title: string;
  summary: string;
  auth: string;
  permission: "read" | "run";
  requestShape?: string | null;
  responseShape: string;
};

export const PLATFORM_ENDPOINTS: PlatformEndpointReference[] = [
  {
    id: "list-machines",
    method: "GET",
    path: "/machines",
    title: "List machines",
    summary: "Returns machines visible to the current API key scope.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ machines: MachineSummary[] }",
  },
  {
    id: "get-machine",
    method: "GET",
    path: "/machines/{machine_id}",
    title: "Get machine",
    summary: "Returns a single machine with the same visibility rules as the product UI.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "MachineDetail",
  },
  {
    id: "list-machine-commands",
    method: "GET",
    path: "/machines/{machine_id}/commands",
    title: "List command templates",
    summary: "Returns enabled command templates that the API key can execute on the machine.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ commands: MachineCommandTemplateRead[] }",
  },
  {
    id: "create-task",
    method: "POST",
    path: "/tasks",
    title: "Create task",
    summary: "Queues a command template execution on a machine using template params.",
    auth: "Bearer API key",
    permission: "run",
    requestShape: "{ machine_id: string, template_key: string, params: Record<string, string> }",
    responseShape: "{ task: TaskRead }",
  },
  {
    id: "get-task",
    method: "GET",
    path: "/tasks/{task_id}",
    title: "Get task",
    summary: "Returns the current lifecycle state, attempts, and rendered command.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ task: TaskRead }",
  },
  {
    id: "get-task-logs",
    method: "GET",
    path: "/tasks/{task_id}/logs",
    title: "Get task logs",
    summary: "Returns task log lines with stream, sequence, and timestamps.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ logs: TaskLogEntryRead[] }",
  },
  {
    id: "get-result",
    method: "GET",
    path: "/results/{result_id}",
    title: "Get result",
    summary: "Returns the raw execution result including shell payload and parsed output.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ result: CommandExecutionResultRead }",
  },
  {
    id: "get-result-summary",
    method: "GET",
    path: "/results/{result_id}/summary",
    title: "Get result summary",
    summary: "Returns the normalized summary model for dashboards and reporting.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ summary: ResultSummaryRead }",
  },
  {
    id: "export-result-json",
    method: "GET",
    path: "/results/{result_id}/export/json",
    title: "Export result JSON",
    summary: "Exports the result in a transport-friendly JSON shape for downstream systems.",
    auth: "Bearer API key",
    permission: "read",
    responseShape: "{ export: ReportExportRead }",
  },
];
