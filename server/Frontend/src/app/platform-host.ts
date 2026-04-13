export type HostAppKind =
  | "nerior-site"
  | "crossplat"
  | "docs"
  | "community"
  | "help"
  | "api"
  | "smart-planner"
  | "karpik";

const HOST_KIND_MAP: Array<[HostAppKind, Set<string>]> = [
  ["nerior-site", new Set(["nerior.store", "www.nerior.store", "nerior.localhost"])],
  ["crossplat", new Set(["crossplat.nerior.store", "crossplat.localhost", "localhost", "127.0.0.1"])],
  ["docs", new Set(["docs.nerior.store", "docs.localhost"])],
  ["community", new Set(["community.nerior.store", "community.localhost"])],
  ["help", new Set(["help.nerior.store", "help.localhost"])],
  ["api", new Set(["api.nerior.store", "api.localhost", "platform.nerior.store", "platform.localhost"])],
  ["smart-planner", new Set(["smart-planner.nerior.store", "smart-planner.localhost"])],
  ["karpik", new Set(["karpik.nerior.store", "karpik.localhost"])],
];

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

export function resolveHostApp(hostname: string): HostAppKind {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return "crossplat";
  }

  for (const [kind, hosts] of HOST_KIND_MAP) {
    if (hosts.has(normalized)) {
      return kind;
    }
  }

  if (normalized.startsWith("docs.")) {
    return "docs";
  }
  if (normalized.startsWith("community.")) {
    return "community";
  }
  if (normalized.startsWith("help.")) {
    return "help";
  }
  if (normalized.startsWith("api.") || normalized.startsWith("platform.")) {
    return "api";
  }
  if (normalized.startsWith("smart-planner.")) {
    return "smart-planner";
  }
  if (normalized.startsWith("karpik.")) {
    return "karpik";
  }
  if (normalized.startsWith("crossplat.")) {
    return "crossplat";
  }

  return "crossplat";
}
