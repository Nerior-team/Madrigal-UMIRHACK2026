import { describe, expect, it } from "vitest";

import { getSearchMatches, type SearchTarget } from "./search";

const targets: SearchTarget[] = [
  {
    id: "menu-machines",
    kind: "menu",
    title: "Машины",
    subtitle: "Раздел инфраструктуры",
    href: "/machines",
    keywords: ["агенты", "серверы"],
  },
  {
    id: "machine-win-10",
    kind: "machine",
    title: "win_10",
    subtitle: "Windows 10.0.19044",
    href: "/machines/machine-win-10",
    keywords: ["онлайн", "рабочая станция"],
  },
  {
    id: "task-disk-usage",
    kind: "task",
    title: "Disk usage",
    subtitle: "win_10",
    href: "/tasks/task-disk-usage",
    keywords: ["storage", "logs"],
  },
  {
    id: "result-diagnostics",
    kind: "result",
    title: "Basic diagnostics",
    subtitle: "Ubuntu prod",
    href: "/results/result-diagnostics",
    keywords: ["успех", "сервер"],
  },
];

describe("getSearchMatches", () => {
  it("prioritizes title prefix matches over weaker matches", () => {
    const matches = getSearchMatches("win", targets);

    expect(matches.map((entry) => entry.id)).toEqual([
      "machine-win-10",
      "task-disk-usage",
    ]);
  });

  it("supports multi-token matching across title and metadata", () => {
    const matches = getSearchMatches("basic ubuntu", targets);

    expect(matches[0]).toMatchObject({
      id: "result-diagnostics",
      href: "/results/result-diagnostics",
    });
  });

  it("returns menu matches for partial russian input", () => {
    const matches = getSearchMatches("маш", targets);

    expect(matches[0]).toMatchObject({
      id: "menu-machines",
      kind: "menu",
    });
  });

  it("supports fuzzy subsequence matching for machine names", () => {
    const matches = getSearchMatches("wn10", targets);

    expect(matches[0]).toMatchObject({
      id: "machine-win-10",
      kind: "machine",
    });
  });
});
