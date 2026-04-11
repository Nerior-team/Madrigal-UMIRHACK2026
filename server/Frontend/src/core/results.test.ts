import { describe, expect, it } from "vitest";

import {
  buildResultsFilterOptions,
  filterResultRows,
  formatResultDateRangeLabel,
  type ResultDateRange,
  type ResultRowLike,
} from "./results";

const rows: ResultRowLike[] = [
  {
    id: "result-1",
    title: "Deploy backend",
    statusTone: "success",
    statusLabel: "Выполнено",
    machine: "ubuntu-prod",
    command: "docker compose up --build",
    resultAt: "10.04.2026, 12:00",
    resultAtIso: "2026-04-10T09:00:00Z",
  },
  {
    id: "result-2",
    title: "Disk usage",
    statusTone: "error",
    statusLabel: "Ошибка",
    machine: "windows-prod",
    command: "Get-PSDrive",
    resultAt: "08.04.2026, 08:30",
    resultAtIso: "2026-04-08T05:30:00Z",
  },
];

describe("buildResultsFilterOptions", () => {
  it("builds sorted machine and command options with proper default labels", () => {
    expect(buildResultsFilterOptions(rows)).toEqual({
      machineOptions: [
        { value: "all", label: "Все машины" },
        { value: "ubuntu-prod", label: "ubuntu-prod" },
        { value: "windows-prod", label: "windows-prod" },
      ],
      commandOptions: [
        { value: "all", label: "Все команды" },
        { value: "docker compose up --build", label: "docker compose up --build" },
        { value: "Get-PSDrive", label: "Get-PSDrive" },
      ],
    });
  });
});

describe("filterResultRows", () => {
  it("filters results by status, machine, command, search query, and date range", () => {
    const dateRange: ResultDateRange = { from: "2026-04-09", to: "2026-04-10" };

    expect(
      filterResultRows(rows, {
        status: "success",
        machine: "ubuntu-prod",
        command: "docker compose up --build",
        searchQuery: "deploy",
        dateRange,
      }),
    ).toEqual([rows[0]]);
  });

  it("treats the date range as inclusive for the whole day", () => {
    expect(
      filterResultRows(rows, {
        status: "all",
        machine: "all",
        command: "all",
        searchQuery: "",
        dateRange: { from: "", to: "2026-04-08" },
      }),
    ).toEqual([rows[1]]);
  });
});

describe("formatResultDateRangeLabel", () => {
  it("returns a placeholder label when no dates are selected", () => {
    expect(formatResultDateRangeLabel({ from: "", to: "" })).toBe("Выберите срок");
  });

  it("formats full ranges in the UI label", () => {
    expect(
      formatResultDateRangeLabel({ from: "2026-04-01", to: "2026-04-10" }),
    ).toBe("01.04.2026 - 10.04.2026");
  });

  it("formats open-ended ranges", () => {
    expect(formatResultDateRangeLabel({ from: "2026-04-01", to: "" })).toBe(
      "От 01.04.2026",
    );
    expect(formatResultDateRangeLabel({ from: "", to: "2026-04-10" })).toBe(
      "До 10.04.2026",
    );
  });
});
