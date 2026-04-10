import { describe, expect, it } from "vitest";
import source from "./main.tsx?raw";

describe("main bootstrap", () => {
  it("wraps AppRouter with BrowserRouter", () => {
    expect(source).toContain("BrowserRouter");
    expect(source).toMatch(/<BrowserRouter>[\s\S]*<AppRouter \/>[\s\S]*<\/BrowserRouter>/);
  });
});
