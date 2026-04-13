import type { HostAppKind } from "../app/platform-host";

export type PublicNavItem = {
  label: string;
  href: string;
  menu?: Array<{
    label: string;
    href: string;
    note?: string;
    disabled?: boolean;
  }>;
};

export const PRODUCT_ITEMS = [
  {
    name: "Crossplat",
    href: "https://crossplat.nerior.store",
    description: "Управление агентами, машинами, задачами, логами и результатами.",
    status: "active" as const,
  },
  {
    name: "Smart-Planner",
    href: "https://smart-planner.nerior.store",
    description: "Не доступно в данный момент.",
    status: "disabled" as const,
  },
  {
    name: "Karpik",
    href: "https://karpik.nerior.store",
    description: "Не доступно в данный момент.",
    status: "disabled" as const,
  },
] as const;

export const MAIN_NAV: PublicNavItem[] = [
  { label: "Обновления", href: "/updates" },
  {
    label: "Продукты",
    href: "/#products",
    menu: PRODUCT_ITEMS.map((product) => ({
      label: product.name,
      href: product.href,
      note: product.description,
      disabled: product.status === "disabled",
    })),
  },
  { label: "Бизнес", href: "/business" },
  {
    label: "Компания",
    href: "/company",
    menu: [
      { label: "О нас", href: "/company#about", note: "Позиционирование и принципы." },
      { label: "Карьеры", href: "/company#careers", note: "Команда и роли." },
      { label: "Истории", href: "/company#stories", note: "Кейсы и практики." },
    ],
  },
  {
    label: "Разработчикам",
    href: "https://docs.nerior.store",
    menu: [
      { label: "API", href: "https://api.nerior.store", note: "Ключи, доступ и usage." },
      { label: "Документация", href: "https://docs.nerior.store", note: "Руководства и схемы." },
      { label: "Сообщество", href: "https://community.nerior.store", note: "Обсуждения и релизы." },
    ],
  },
];

export const UPDATE_CATEGORIES = [
  "Все",
  "Публикации",
  "Анонсы",
  "Интеграции",
  "Релиз",
] as const;

export const DOCS_SECTIONS = [
  {
    title: "Начало работы",
    body: "Здесь должно быть описание архитектуры Nerior, сценариев использования и карты сервисов.",
  },
  {
    title: "Crossplat",
    body: "Здесь должно быть описание Crossplat, структуры аккаунта, авторизации и рабочих сценариев.",
  },
  {
    title: "API и интеграции",
    body: "Здесь должны быть описание и роуты к API, авторизации, ключам, ограничениям и примерам запросов.",
  },
  {
    title: "Документация по продуктам",
    body: "Здесь должно быть описание разделения документации по Crossplat, Smart-Planner и Karpik.",
  },
  {
    title: "Практические руководства",
    body: "Здесь должны быть инструкции, сценарии внедрения, диагностика и частые рабочие паттерны.",
  },
] as const;

export const COMMUNITY_SECTIONS = [
  {
    title: "Обновления сообщества",
    body: "Здесь должны быть анонсы встреч, релизные обсуждения и публичные заметки команды.",
  },
  {
    title: "Обсуждения",
    body: "Здесь должно быть описание того, как пользователи обсуждают сценарии использования и интеграции.",
  },
  {
    title: "Материалы",
    body: "Здесь должны быть ссылки на разборы, записи, презентации и полезные внешние материалы.",
  },
] as const;

export const HELP_SECTIONS = [
  {
    title: "Начало работы",
    body: "Здесь должно быть описание первых шагов, регистрации, доступа и структуры сервисов Nerior.",
  },
  {
    title: "Аккаунт и доступ",
    body: "Здесь должно быть описание восстановления доступа, авторизации и ролей.",
  },
  {
    title: "Crossplat",
    body: "Здесь должно быть описание типовых вопросов по машинам, задачам, логам и результатам.",
  },
  {
    title: "API",
    body: "Здесь должно быть описание ключей, ограничений, ошибок и способов диагностики API.",
  },
] as const;

export const NERIOR_METRICS = [
  { label: "Продукты", value: "3" },
  { label: "Публичные сервисы", value: "6" },
  { label: "Точки для разработчиков", value: "3" },
  { label: "Фокус", value: "Инфраструктура" },
] as const;

export function getPublicTitle(kind: HostAppKind): string {
  switch (kind) {
    case "docs":
      return "Документация";
    case "community":
      return "Сообщество";
    case "help":
      return "Справочный центр";
    case "smart-planner":
      return "Smart-Planner";
    case "karpik":
      return "Karpik";
    default:
      return "Nerior";
  }
}

export function resolvePublicNav(kind: Exclude<HostAppKind, "crossplat" | "api">): PublicNavItem[] {
  if (kind === "nerior-site") {
    return MAIN_NAV;
  }

  return MAIN_NAV.map((item) => ({
    ...item,
    href: item.href.startsWith("/") ? `https://nerior.store${item.href}` : item.href,
    menu: item.menu?.map((menuItem) => ({
      ...menuItem,
      href: menuItem.href.startsWith("/") ? `https://nerior.store${menuItem.href}` : menuItem.href,
    })),
  }));
}
