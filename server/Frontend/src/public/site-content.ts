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
      { label: "Карьера", href: "/company#careers", note: "Команда и роли" },
      { label: "Истории", href: "/company#stories", note: "Кейсы и практики" },
    ],
  },
  {
    label: "Разработчикам",
    href: "https://docs.nerior.store",
    menu: [
      { label: "API платформа", href: "https://api.nerior.store", note: "Ключи, доступ и usage" },
      { label: "Документации", href: "https://docs.nerior.store", note: "Структура и материалы" },
      { label: "Руководства", href: "https://docs.nerior.store", note: "Практические сценарии" },
      { label: "Сообщество", href: "https://community.nerior.store", note: "Обсуждения и анонсы" },
    ],
  },
];

export const UPDATE_CATEGORIES = ["Все", "Публикация", "Анонсы", "Интеграции", "Релиз"] as const;

export const DOCS_PILLARS = [
  {
    title: "Архитектура",
    body: "Здесь должно быть описание общей архитектуры Nerior, сервисных зон и связей между продуктами.",
  },
  {
    title: "Интеграции",
    body: "Здесь должно быть описание практических сценариев интеграции, входных точек и структуры материалов для разработчиков.",
  },
  {
    title: "Роуты и схемы",
    body: "Здесь должны быть описания и роуты к API, схемам запросов и ответов, а также ограничениям по каждому направлению.",
  },
] as const;

export const DOCS_SECTIONS = [
  {
    title: "Начало работы",
    body: "Здесь должно быть описание того, как устроена документация Nerior, как выбрать нужный продукт и с чего начинать чтение материалов.",
  },
  {
    title: "Crossplat",
    body: "Здесь должно быть описание продукта Crossplat, структуры аккаунта, рабочих сценариев и связанных материалов для пользователя и команды.",
  },
  {
    title: "API и интеграции",
    body: "Здесь должно быть описание и роуты к API, ключам доступа, авторизации, ограничениям и примерам запросов.",
  },
  {
    title: "Документация по продуктам",
    body: "Здесь должно быть описание того, как разделена документация по Crossplat, Smart planner и Karpik, и какие разделы относятся к каждому продукту.",
  },
  {
    title: "Практические руководства",
    body: "Здесь должны быть инструкции, типовые сценарии внедрения, диагностики и пошаговые материалы для работы с сервисами.",
  },
  {
    title: "Справочные материалы",
    body: "Здесь должны быть схемы сущностей, форматы событий, типовые ответы API и служебные справочные разделы.",
  },
] as const;

export const DOCS_LIBRARY_GROUPS = [
  {
    title: "Продуктовые руководства",
    items: [
      "Здесь должно быть описание структуры руководств по Crossplat.",
      "Здесь должно быть описание onboarding-материалов для новых команд.",
      "Здесь должно быть описание практических рабочих сценариев.",
    ],
  },
  {
    title: "API и SDK",
    items: [
      "Здесь должно быть описание и роуты к API Crossplat.",
      "Здесь должно быть описание ограничений доступа, scopes и ключей.",
      "Здесь должно быть описание SDK, примеров запросов и ответов.",
    ],
  },
  {
    title: "Операционные документы",
    items: [
      "Здесь должно быть описание runbook-материалов и диагностики.",
      "Здесь должно быть описание deployment и service-операций.",
      "Здесь должно быть описание служебных схем и вспомогательных таблиц.",
    ],
  },
] as const;

export const COMMUNITY_PILLARS = [
  {
    title: "Обсуждения",
    body: "Здесь должно быть описание публичных обсуждений, открытых тем и форматов взаимодействия с командой.",
  },
  {
    title: "Материалы",
    body: "Здесь должны быть подборки записей, заметок, презентаций, разборов и анонсов для сообщества.",
  },
  {
    title: "События",
    body: "Здесь должны быть анонсы встреч, запусков и будущих публичных активностей команды Nerior.",
  },
] as const;

export const COMMUNITY_SECTIONS = [
  {
    title: "Обновления сообщества",
    body: "Здесь должно быть описание анонсов, публичных мероприятий, релизных заметок и новостей для внешней аудитории.",
  },
  {
    title: "Обсуждения",
    body: "Здесь должно быть описание форматов общения, тем обсуждений и того, как пользователи и разработчики взаимодействуют внутри сообщества.",
  },
  {
    title: "Материалы",
    body: "Здесь должны быть ссылки на разборы, записи, презентации, подборки материалов и внешние публикации.",
  },
] as const;

export const COMMUNITY_CHANNELS = [
  {
    title: "Публикации и анонсы",
    body: "Здесь должно быть описание того, как выходят анонсы, заметки, обновления и публичные публикации команды.",
  },
  {
    title: "Обратная связь",
    body: "Здесь должно быть описание форматов вопросов, обратной связи и вовлечения внешней аудитории.",
  },
  {
    title: "Открытые материалы",
    body: "Здесь должно быть описание библиотек материалов, открытых разборов и community-архива.",
  },
] as const;

export const HELP_PILLARS = [
  {
    title: "Быстрый старт",
    body: "Здесь должно быть краткое введение в продукты Nerior, доступ и первые действия для нового пользователя.",
  },
  {
    title: "Диагностика",
    body: "Здесь должны быть сценарии поиска проблем, восстановления доступа и навигации по сервисам.",
  },
  {
    title: "Поддержка",
    body: "Здесь должно быть описание каналов поддержки, SLA и маршрутов эскалации вопросов.",
  },
] as const;

export const HELP_SECTIONS = [
  {
    title: "Начало работы",
    body: "Здесь должно быть описание первых шагов, структуры сервисов Nerior и маршрута для нового пользователя.",
  },
  {
    title: "Аккаунт и доступ",
    body: "Здесь должно быть описание авторизации, восстановления доступа, ролей и базовых сценариев управления аккаунтом.",
  },
  {
    title: "Crossplat",
    body: "Здесь должно быть описание частых вопросов по машинам, задачам, логам, результатам и рабочим операциям Crossplat.",
  },
  {
    title: "API",
    body: "Здесь должно быть описание ключей доступа, ограничений, ошибок, диагностики и маршрутов к связанным разделам API.",
  },
] as const;

export const HELP_GROUPS = [
  {
    title: "Для новых пользователей",
    items: [
      "Здесь должно быть описание регистрации и входа.",
      "Здесь должно быть описание первых действий после входа.",
      "Здесь должно быть описание маршрута в нужный продукт или сервис.",
    ],
  },
  {
    title: "Для команд",
    items: [
      "Здесь должно быть описание управления доступами и ролями.",
      "Здесь должно быть описание типовых вопросов по Crossplat.",
      "Здесь должно быть описание перехода в docs, community и API.",
    ],
  },
  {
    title: "Для поддержки",
    items: [
      "Здесь должно быть описание эскалации вопросов.",
      "Здесь должно быть описание путей диагностики и восстановлений.",
      "Здесь должно быть описание того, когда нужно обращаться через форму связи.",
    ],
  },
] as const;

export const NERIOR_METRICS = [
  { label: "Продукты", value: "3" },
  { label: "Публичные поверхности", value: "6" },
  { label: "Точки для разработчиков", value: "3" },
  { label: "Фокус", value: "Инфраструктура" },
] as const;

export function getPublicTitle(kind: HostAppKind): string {
  switch (kind) {
    case "docs":
    case "community":
    case "help":
    case "smart-planner":
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
