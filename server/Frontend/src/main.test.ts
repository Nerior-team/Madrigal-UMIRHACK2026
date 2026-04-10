import { describe, expect, it } from "vitest";
import { join } from "node:path";

declare function require(name: string): {
  readFileSync(path: string, encoding: string): string;
};

const { readFileSync } = require("node:fs");

describe("main bootstrap", () => {
  it("wraps AppRouter with BrowserRouter", () => {
    const source = readFileSync(join(process.cwd(), "src", "main.tsx"), "utf8");

    expect(source).toContain("BrowserRouter");
    expect(source).toMatch(/<BrowserRouter>[\s\S]*<AppRouter \/>[\s\S]*<\/BrowserRouter>/);
  });
});
