export type PlatformRouteKey = "overview" | "keys" | "analytics";

export type PlatformRouteItem = {
  key: PlatformRouteKey;
  path: string;
  label: string;
  eyebrow: string;
};

export const PLATFORM_ROUTE_ITEMS: PlatformRouteItem[] = [
  {
    key: "overview",
    path: "/",
    label: "Обзор",
    eyebrow: "API",
  },
  {
    key: "keys",
    path: "/keys",
    label: "Ключи",
    eyebrow: "Доступ",
  },
  {
    key: "analytics",
    path: "/analytics",
    label: "Аналитика",
    eyebrow: "Статистика",
  },
];

export const PLATFORM_ROUTE_PATHS = PLATFORM_ROUTE_ITEMS.map((item) => item.path);

export function resolvePlatformRoute(pathname: string): PlatformRouteItem {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname || "/";
  return PLATFORM_ROUTE_ITEMS.find((item) => item.path === normalized) ?? PLATFORM_ROUTE_ITEMS[0];
}
