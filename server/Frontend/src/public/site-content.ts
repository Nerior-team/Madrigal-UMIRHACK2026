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
    name: "Smart planner",
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
      { label: "О нас", href: "/company#about", note: "Изучить компанию" },
      { label: "Карьеры", href: "/company#careers", note: "Команда и роли" },
      { label: "Истории", href: "/company#stories", note: "Кейсы и практики" },
    ],
  },
  {
    label: "Разработчикам",
    href: "https://docs.nerior.store",
    menu: [
      { label: "API платформа", href: "https://api.nerior.store", note: "Ключи, доступ и usage" },
      { label: "Документации", href: "https://docs.nerior.store", note: "Руководства и схемы" },
      { label: "Руководства", href: "https://docs.nerior.store", note: "Практические сценарии" },
      { label: "Сообщество", href: "https://community.nerior.store", note: "Обсуждения и релизы" },
    ],
  },
];

export const UPDATE_CATEGORIES = [
  "Все",
  "Публикация",
  "Анонсы",
  "Интеграции",
  "Релиз",
] as const;

export const DOCS_SECTIONS = [
  {
    title: "Начало работы",
    body: "Здесь должно быть описание архитектуры Nerior, карты сервисов и общих сценариев использования.",
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

export const DOCS_PILLARS = [
  {
    title: "Архитектура",
    body: "Здесь должно быть описание общей архитектуры Nerior, сервисов и связей между ними.",
  },
  {
    title: "Интеграции",
    body: "Здесь должны быть сценарии интеграции, входные точки и структура материалов для разработчиков.",
  },
  {
    title: "Роуты и схемы",
    body: "Здесь должны быть описание и роуты к API, схемам запросов и ответов, а также ограничениям.",
  },
] as const;

export const COMMUNITY_PILLARS = [
  {
    title: "Обсуждения",
    body: "Здесь должно быть описание публичных обсуждений, вопросов и релизных веток сообщества.",
  },
  {
    title: "Материалы",
    body: "Здесь должны быть публичные подборки материалов, записей, презентаций и разборов.",
  },
  {
    title: "События",
    body: "Здесь должны быть анонсы встреч, запусков и будущих публичных активностей команды.",
  },
] as const;

export const HELP_PILLARS = [
  {
    title: "Быстрый старт",
    body: "Здесь должно быть краткое введение в Nerior, продукты, доступ и первые шаги.",
  },
  {
    title: "Диагностика",
    body: "Здесь должны быть сценарии поиска проблем, восстановления доступа и навигации по сервисам.",
  },
  {
    title: "Поддержка",
    body: "Здесь должно быть описание каналов поддержки, SLA и способов эскалации вопросов.",
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
      return "Nerior";
    case "community":
      return "Nerior";
    case "help":
      return "Nerior";
    case "smart-planner":
      return "Nerior";
    case "karpik":
      return "Nerior";
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
