import { describe, expect, it } from "vitest";

import {
  buildTaskSections,
  getTaskPresentation,
  groupTasksByStatus,
} from "./operations";

describe("getTaskPresentation", () => {
  it("keeps queued lifecycle separate from in-progress work", () => {
    expect(getTaskPresentation("queued")).toMatchObject({
      group: "queued",
      taskStatusLabel: "В очереди",
      resultLabel: "Задача в очереди",
    });
  });

  it("maps cancelled tasks to completed group with explicit cancel wording", () => {
    expect(getTaskPresentation("cancelled")).toMatchObject({
      group: "completed",
      taskStatusLabel: "Отменено",
      resultLabel: "Задача отменена",
      resultStatusTone: "cancelled",
    });
  });
});

describe("groupTasksByStatus", () => {
  it("groups cards into four visible operational columns", () => {
    const grouped = groupTasksByStatus([
      { id: "1", status: "queued" as const },
      { id: "2", status: "in_progress" as const },
      { id: "3", status: "completed" as const },
      { id: "4", status: "error" as const },
      { id: "5", status: "completed" as const },
    ]);

    expect(grouped.queued.map((item) => item.id)).toEqual(["1"]);
    expect(grouped.in_progress.map((item) => item.id)).toEqual(["2"]);
    expect(grouped.completed.map((item) => item.id)).toEqual(["3", "5"]);
    expect(grouped.error.map((item) => item.id)).toEqual(["4"]);
  });
});

describe("buildTaskSections", () => {
  it("keeps queued tasks visible between in-progress and error sections", () => {
    const sections = buildTaskSections([
      { id: "1", status: "completed" as const },
      { id: "2", status: "in_progress" as const },
      { id: "3", status: "queued" as const },
      { id: "4", status: "error" as const },
    ]);

    expect(sections.map((section) => section.key)).toEqual([
      "completed",
      "in_progress",
      "queued",
      "error",
    ]);
    expect(sections.map((section) => section.cards.length)).toEqual([1, 1, 1, 1]);
  });
});
