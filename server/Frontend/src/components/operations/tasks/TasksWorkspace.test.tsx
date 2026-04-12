import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TasksWorkspace, type TasksWorkspaceProps } from "./TasksWorkspace";

function createTaskCards(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `task-${index + 1}`,
    machineId: "machine-1",
    machine: "ubuntu-prod",
    templateKey: "system:deploy",
    renderedCommand: "docker compose up --build",
    requestedBy: "owner@example.com",
    taskNumber: `${index + 1}`,
    title: `Deploy backend ${index + 1}`,
    startedAt: "10.04.2026, 12:00",
    startedAtIso: "2026-04-10T09:00:00Z",
    completedAt: "10.04.2026, 12:05",
    completedAtIso: "2026-04-10T09:05:00Z",
    serverNumber: "1",
    resultText: "Задача завершена",
    resultColor: "green" as const,
    statusLabel: "Завершено",
    status: "completed" as const,
  }));
}

function createProps(): TasksWorkspaceProps {
  return {
    totalItems: 7,
    activeFilter: "all",
    machineValue: "all",
    templateValue: "all",
    dateRange: { from: "", to: "" },
    machineOptions: [
      { value: "all", label: "Все машины" },
      { value: "ubuntu-prod", label: "ubuntu-prod" },
    ],
    templateOptions: [
      { value: "all", label: "Все типы задач" },
      { value: "system:deploy", label: "Deploy backend 1 • system:deploy" },
    ],
    sections: [
      {
        key: "completed",
        label: "Завершённые",
        cards: createTaskCards(7),
      },
      {
        key: "in_progress",
        label: "В процессе",
        cards: [],
      },
      {
        key: "queued",
        label: "В очереди",
        cards: [],
      },
      {
        key: "error",
        label: "Ошибки",
        cards: [],
      },
    ],
    onFilterChange: vi.fn(),
    onMachineChange: vi.fn(),
    onTemplateChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    onOpenLogs: vi.fn(),
    onSecondaryAction: vi.fn(),
  };
}

describe("TasksWorkspace", () => {
  it("renders status chips and paginates long task sections", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<TasksWorkspace {...props} />);

    expect(screen.getByRole("heading", { name: "Задачи" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "В очереди" })).toBeInTheDocument();
    expect(screen.getByText("Deploy backend 1")).toBeInTheDocument();
    expect(screen.queryByText("Deploy backend 7")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Вперёд" }));

    expect(screen.getByText("Deploy backend 7")).toBeInTheDocument();
  });

  it("delegates filter and action callbacks", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<TasksWorkspace {...props} />);

    await user.click(screen.getByRole("button", { name: "В очереди" }));
    await user.click(screen.getAllByRole("button", { name: "Повторить" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Открыть логи" })[0]);

    expect(props.onFilterChange).toHaveBeenCalledWith("queued");
    expect(props.onSecondaryAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-1" }),
    );
    expect(props.onOpenLogs).toHaveBeenCalledWith("task-1", "machine-1");
  });
});
