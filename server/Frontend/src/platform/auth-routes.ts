export type PlatformAuthMode =
  | "login"
  | "register"
  | "verify"
  | "forgot-password"
  | "reset-password";

const PLATFORM_AUTH_PATHS: Record<PlatformAuthMode, string> = {
  login: "/login",
  register: "/register",
  verify: "/verify",
  "forgot-password": "/forgot-password",
  "reset-password": "/reset-password",
};

export const PLATFORM_AUTH_ROUTE_PATHS = Object.values(PLATFORM_AUTH_PATHS);

export function platformAuthPath(mode: PlatformAuthMode): string {
  return PLATFORM_AUTH_PATHS[mode];
}
