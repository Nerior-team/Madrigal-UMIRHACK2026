import { describe, expect, it } from "vitest";

import { formatLogStreamLine } from "./logs";

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
