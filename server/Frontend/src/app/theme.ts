export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "crossplat-theme-mode";

export function normalizeThemeMode(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function resolveInitialThemeMode(
  storedValue: string | null | undefined,
  prefersDark: boolean,
): ThemeMode {
  if (storedValue === "light" || storedValue === "dark") {
    return storedValue;
  }

  return prefersDark ? "dark" : "light";
}

export function applyThemeMode(
  mode: ThemeMode,
  root: Pick<HTMLElement, "dataset">,
) {
  root.dataset.theme = mode;
}
