export type PlatformProductAvailability = {
  key: "crossplat" | "smart-planner" | "karpik";
  name: string;
  description: string;
  status: "available" | "unavailable";
  note: string;
  href?: string;
};

export const PLATFORM_PRODUCTS: PlatformProductAvailability[] = [
  {
    key: "crossplat",
    name: "Crossplat",
    description: "Machine access, task execution, logs, results, and command scopes.",
    status: "available",
    note: "Available now",
    href: "https://crossplat.nerior.store",
  },
  {
    key: "smart-planner",
    name: "Smart-Planner",
    description: "Reserved for future API access and key management.",
    status: "unavailable",
    note: "Not available right now",
  },
  {
    key: "karpik",
    name: "Karpik",
    description: "Reserved for future API access and key management.",
    status: "unavailable",
    note: "Not available right now",
  },
];
