import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResultsWorkspace, type ResultsWorkspaceProps } from "./ResultsWorkspace";

function createRows() {
  return Array.from({ length: 11 }, (_, index) => ({
    id: `result-${index + 1}`,
    taskId: `task-${index + 1}`,
    machineId: "machine-1",
    title: `Task result ${index + 1}`,
    statusLabel: index === 10 ? "Ошибка" : "Выполнено",
    statusTone: (index === 10 ? "error" : "success") as
      | "success"
      | "error"
      | "cancelled"
      | "pending",
    machine: "ubuntu-prod",
    command: index === 10 ? "df -h" : "docker compose up --build",
    resultAt: `10.04.2026, 1${index}:00`,
    resultAtIso: `2026-04-10T1${index}:00:00Z`,
  }));
}

function createProps(): ResultsWorkspaceProps {
  return {
    rows: createRows(),
    totalItems: 11,
    statusValue: "all",
    machineValue: "all",
    commandValue: "all",
    dateRange: { from: "", to: "" },
    machineOptions: [
      { value: "all", label: "Все машины" },
      { value: "ubuntu-prod", label: "ubuntu-prod" },
    ],
    commandOptions: [
      { value: "all", label: "Все команды" },
      { value: "docker compose up --build", label: "docker compose up --build" },
    ],
    onStatusChange: vi.fn(),
    onMachineChange: vi.fn(),
    onCommandChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    onOpenLogs: vi.fn(),
    onOpenResultDetail: vi.fn(),
  };
}

describe("ResultsWorkspace", () => {
  it("renders custom filter labels and paginates result rows", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<ResultsWorkspace {...props} />);

    expect(screen.getByRole("heading", { name: "Результаты" })).toBeInTheDocument();
    expect(screen.getByText("Все машины")).toBeInTheDocument();
    expect(screen.getByText("Все команды")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выберите срок" })).toBeInTheDocument();
    expect(screen.getByText("Task result 1")).toBeInTheDocument();
    expect(screen.queryByText("Task result 11")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Вперёд" }));

    expect(screen.getByText("Task result 11")).toBeInTheDocument();
  });

  it("routes row actions through the provided callbacks", async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<ResultsWorkspace {...props} />);

    await user.click(screen.getByRole("button", { name: "Task result 1" }));
    await user.click(screen.getAllByRole("button", { name: "Посмотреть логи" })[0]);

    expect(props.onOpenResultDetail).toHaveBeenCalledWith("result-1", "machine-1");
    expect(props.onOpenLogs).toHaveBeenCalledWith("task-1", "machine-1");
  });
});
