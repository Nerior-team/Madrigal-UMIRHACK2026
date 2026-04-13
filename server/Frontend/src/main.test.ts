import { describe, expect, it } from "vitest";
import source from "./main.tsx?raw";

describe("main bootstrap", () => {
  it("wraps RootRouter with BrowserRouter", () => {
    expect(source).toContain("BrowserRouter");
    expect(source).toMatch(/<BrowserRouter>[\s\S]*<RootRouter \/>[\s\S]*<\/BrowserRouter>/);
  });
});
