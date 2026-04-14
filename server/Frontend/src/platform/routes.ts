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
    label: "\u041e\u0431\u0437\u043e\u0440",
    eyebrow: "API",
  },
  {
    key: "keys",
    path: "/keys",
    label: "\u041a\u043b\u044e\u0447\u0438",
    eyebrow: "\u0414\u043e\u0441\u0442\u0443\u043f",
  },
  {
    key: "analytics",
    path: "/analytics",
    label: "\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430",
    eyebrow: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430",
  },
];

export const PLATFORM_ROUTE_PATHS = PLATFORM_ROUTE_ITEMS.map((item) => item.path);

export function resolvePlatformRoute(pathname: string): PlatformRouteItem {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname || "/";
  return PLATFORM_ROUTE_ITEMS.find((item) => item.path === normalized) ?? PLATFORM_ROUTE_ITEMS[0];
}
