import { describe, expect, it } from "vitest";
import {
  applyThemeMode,
  normalizeThemeMode,
  resolveInitialThemeMode,
} from "./theme";

describe("theme helpers", () => {
  it("normalizes unsupported values to light mode", () => {
    expect(normalizeThemeMode("light")).toBe("light");
    expect(normalizeThemeMode("dark")).toBe("dark");
    expect(normalizeThemeMode("system")).toBe("light");
    expect(normalizeThemeMode(null)).toBe("light");
  });

  it("prefers the stored theme over browser preference", () => {
    expect(resolveInitialThemeMode("dark", false)).toBe("dark");
    expect(resolveInitialThemeMode("light", true)).toBe("light");
  });

  it("falls back to browser preference when storage is empty", () => {
    expect(resolveInitialThemeMode(null, true)).toBe("dark");
    expect(resolveInitialThemeMode(undefined, false)).toBe("light");
  });

  it("applies the selected mode to the root dataset", () => {
    const root = { dataset: {} as DOMStringMap };

    applyThemeMode("dark", root);
    expect(root.dataset.theme).toBe("dark");

    applyThemeMode("light", root);
    expect(root.dataset.theme).toBe("light");
  });
});
