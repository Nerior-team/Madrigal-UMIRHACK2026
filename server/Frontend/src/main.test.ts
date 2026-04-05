import { describe, expect, it } from "vitest";

declare function require(name: string): {
  readFileSync(path: URL, encoding: string): string;
};

const { readFileSync } = require("node:fs");

describe("main bootstrap", () => {
  it("wraps App with BrowserRouter", () => {
    const source = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");

    expect(source).toContain("BrowserRouter");
    expect(source).toMatch(/<BrowserRouter>[\s\S]*<App \/>[\s\S]*<\/BrowserRouter>/);
  });
});
