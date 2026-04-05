import { describe, expect, it } from "vitest";

import {
  formatMoscowDateTime,
  matchesSearchQuery,
  normalizeMachineOsLabel,
  normalizeMachineTitle,
} from "./ui";

describe("normalizeMachineTitle", () => {
  it("returns the original display name without appending ids", () => {
    expect(normalizeMachineTitle("win_10")).toBe("win_10");
  });

  it("collapses kernel-style linux names into a readable title", () => {
    expect(
      normalizeMachineTitle(
        "linux #1 SMP PREEMPT_DYNAMIC Wed Oct 29 18:42:47 MSK 2025",
      ),
    ).toBe("Linux");
  });
});

describe("normalizeMachineOsLabel", () => {
  it("strips linux kernel build tails with timestamps", () => {
    expect(
      normalizeMachineOsLabel(
        "linux #1 SMP PREEMPT_DYNAMIC Wed Oct 29 18:42:47 MSK 2025",
      ),
    ).toBe("Linux");
  });

  it("keeps meaningful operating system labels intact", () => {
    expect(normalizeMachineOsLabel("Windows 11")).toBe("Windows 11");
  });
});

describe("formatMoscowDateTime", () => {
  it("formats timestamps in Moscow time", () => {
    expect(formatMoscowDateTime("2026-04-04T09:00:00Z")).toBe(
      "04.04.2026, 12:00",
    );
  });
});

describe("matchesSearchQuery", () => {
  it("matches search text against multiple normalized fields", () => {
    expect(
      matchesSearchQuery("stepa", ["Linux", "stepa4ik", "owner@example.com"]),
    ).toBe(true);
  });

  it("returns true for empty query", () => {
    expect(matchesSearchQuery("", ["anything"])).toBe(true);
  });

  it("returns false when no fields contain the query", () => {
    expect(matchesSearchQuery("docker", ["Windows 11", "stepa4ik"])).toBe(
      false,
    );
  });
});
