import type { FormEvent } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MachineWorkspace, type MachineWorkspaceProps } from "./MachineWorkspace";

function createProps(): MachineWorkspaceProps {
  return {
    machine: {
      id: "machine-1",
      name: "prod-linux",
      hostname: "prod-linux.internal",
      os: "linux 6.8",
      heartbeat: "11.04.2026, 15:12",
      owner: "owner@example.com",
      role: "Администратор",
      status: "online",
      statusLabel: "Онлайн",
    },
    canCreateTask: true,
    taskRoleLabel: "Администратор",
    taskTemplateOptions: [
      {
        templateKey: "docker:logs",
        name: "Docker logs",
        description: null,
        runner: "shell",
        commandPattern: "docker logs {container}",
        parameters: [
          {
            key: "container",
            label: "Контейнер",
            allowedValues: ["api"],
          },
        ],
        parserKind: "text",
      },
    ],
    selectedTaskTemplateKey: "docker:logs",
    selectedTaskParameterValues: { container: "api" },
    taskUseSudo: true,
    taskShellLabel: "Bash",
    taskPreviewCommand: "sudo docker logs api",
    canSubmitTask: true,
    onTaskTemplateChange: vi.fn(),
    onTaskParameterChange: vi.fn(),
    onTaskUseSudoChange: vi.fn(),
    onTaskReset: vi.fn(),
    onTaskSubmit: vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    ),
    onCopyTaskPreview: vi.fn(),
    onOpenTasks: vi.fn(),
    onOpenResults: vi.fn(),
    onOpenLogs: vi.fn(),
    onOpenTaskLogs: vi.fn(),
    onOpenResultDetail: vi.fn(),
    tasks: [
      {
        id: "task-1",
        title: "Docker logs",
        taskNumber: "42",
        startedAt: "11.04.2026, 15:00",
        completedAt: undefined,
        resultText: "В процессе",
        status: "in_progress",
        machineId: "machine-1",
      },
    ],
    results: [
      {
        id: "result-1",
        title: "Docker logs",
        statusLabel: "Выполнено",
        statusTone: "success",
        command: "docker logs api",
        resultAt: "11.04.2026, 15:05",
        taskId: "task-1",
        machineId: "machine-1",
      },
    ],
    logs: [
      {
        id: "log-1",
        taskId: "task-1",
        taskTitle: "Docker logs",
        action: "Отправленная задача",
        email: "operator@example.com",
        status: "Выполнено",
        tone: "success",
        createdAt: "11.04.2026, 15:05",
        machineId: "machine-1",
      },
    ],
  };
}

describe("MachineWorkspace", () => {
  it("renders one unified machine page with task, results and logs sections", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MachineWorkspace {...props} />);

    expect(screen.getByRole("heading", { name: "Задача" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Недавние задачи" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Результаты" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Логи" })).toBeInTheDocument();
    expect(screen.getByText("sudo docker logs api")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Посмотреть логи" })[0]);

    expect(props.onOpenTaskLogs).toHaveBeenCalledWith("task-1");
  });
});
