import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LogsWorkspace, type LogsWorkspaceProps } from "./LogsWorkspace";

function createProps(): LogsWorkspaceProps {
  return {
    scopeSummary: 'Логи задачи "Deploy backend" по машине ubuntu-prod',
    filterTone: "all",
    statusStats: {
      success: 1,
      warning: 0,
      critical: 0,
    },
    totalEntries: 1,
    totalStreamItems: 1,
    autoScrollEnabled: true,
    entries: [
      {
        id: "log-1",
        taskId: "task-1",
        machineId: "machine-1",
        taskTitle: "Deploy backend",
        action: "Отправленная задача",
        email: "operator@example.com",
        status: "Выполнено",
        tone: "success",
        createdAt: "11.04.2026, 16:00",
        machine: "ubuntu-prod",
      },
    ],
    streamItems: [
      {
        id: "stream-1",
        taskId: "task-1",
        machineId: "machine-1",
        kind: "request",
        machine: "ubuntu-prod",
        title: "Deploy backend",
        text: "docker compose up --build -d",
        createdAt: "2026-04-11T13:00:00Z",
      },
    ],
    onFilterToneChange: vi.fn(),
    onToggleAutoScroll: vi.fn(),
    onOpenTaskLogs: vi.fn(),
  };
}

describe("LogsWorkspace", () => {
  it("renders scoped logs and console output for the selected task", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<LogsWorkspace {...props} />);

    expect(screen.getByRole("heading", { name: "Логи" })).toBeInTheDocument();
    expect(screen.getByText(props.scopeSummary)).toBeInTheDocument();
    expect(screen.getByText("operator@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Отправленная задача (11.04.2026, 16:00 ubuntu-prod): docker compose up --build -d",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "К деталям" }));

    expect(props.onOpenTaskLogs).toHaveBeenCalledWith("task-1", "machine-1");
  });
});
