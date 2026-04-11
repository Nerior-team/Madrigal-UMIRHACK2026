import { describe, expect, it } from "vitest";

import { buildLogsScopeSummary, formatLogStreamLine } from "./logs";

describe("formatLogStreamLine", () => {
  it("formats request lines in Moscow time", () => {
    expect(
      formatLogStreamLine({
        kind: "request",
        createdAt: "2026-04-04T09:00:00Z",
        machine: "ubuntu-prod",
        text: "docker compose up --build -d",
      }),
    ).toBe(
      "Отправленная задача (04.04.2026, 12:00 ubuntu-prod): docker compose up --build -d",
    );
  });

  it("formats response lines in Moscow time", () => {
    expect(
      formatLogStreamLine({
        kind: "response",
        createdAt: "2026-04-04T09:01:00Z",
        machine: "ubuntu-prod",
        text: "Порт 443 открыт",
      }),
    ).toBe("Ответ (04.04.2026, 12:01 ubuntu-prod): Порт 443 открыт");
  });
});

describe("buildLogsScopeSummary", () => {
  it("builds machine and task aware summary when route is scoped", () => {
    expect(
      buildLogsScopeSummary({
        machine: "ubuntu-prod",
        taskTitle: "Deploy backend",
      }),
    ).toBe('Логи задачи "Deploy backend" по машине ubuntu-prod');
  });

  it("falls back to the generic logs copy when no scope is set", () => {
    expect(buildLogsScopeSummary({ machine: null, taskTitle: null })).toBe(
      "История системных событий по задачам и машинам",
    );
  });
});
