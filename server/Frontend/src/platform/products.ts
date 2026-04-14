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
    description: "Доступ к машинам, задачам, логам, результатам и шаблонам команд.",
    status: "available",
    note: "Доступно",
    href: "https://crossplat.nerior.store",
  },
  {
    key: "smart-planner",
    name: "Smart planner",
    description: "Зарезервировано под будущий API-доступ и управление ключами.",
    status: "unavailable",
    note: "Не доступно",
  },
  {
    key: "karpik",
    name: "Karpik",
    description: "Зарезервировано под будущий API-доступ и управление ключами.",
    status: "unavailable",
    note: "Не доступно",
  },
];
