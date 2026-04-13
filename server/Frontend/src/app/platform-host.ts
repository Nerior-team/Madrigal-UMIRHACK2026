export type HostAppKind = "main" | "platform";

const PLATFORM_HOSTS = new Set([
  "platform.nerior.store",
  "platform.localhost",
]);

export function isPlatformHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return PLATFORM_HOSTS.has(normalized) || normalized.startsWith("platform.");
}

export function resolveHostApp(hostname: string): HostAppKind {
  return isPlatformHost(hostname) ? "platform" : "main";
}
