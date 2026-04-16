import { DOC_TEXTS, type DocTextKey } from "./docs-text.generated";

export type DocsTopTabKey = "general" | "crossplat" | "smart-planner" | "karpik";

export type DocsTopTab = {
  key: DocsTopTabKey;
  label: string;
  href: string;
};

export type DocsPage = {
  href: string;
  tab: DocsTopTabKey;
  sidebarLabel: string;
  title: string;
  docKeys: DocTextKey[];
};

export const DOCS_TOP_TABS: DocsTopTab[] = [
  { key: "general", label: "Общее", href: "/general" },
  { key: "crossplat", label: "Crossplat", href: "/crossplat" },
  { key: "smart-planner", label: "Smart-Planner", href: "/smart-planner" },
  { key: "karpik", label: "Karpik", href: "/karpik" },
];

export const DOCS_PAGES: DocsPage[] = [
  { href: "/general", tab: "general", sidebarLabel: "Обзор", title: "Общая документация", docKeys: ["Общее\\01_Обзор.txt"] },
  { href: "/general/crossplat", tab: "general", sidebarLabel: "Что такое Crossplat", title: "Что такое Crossplat", docKeys: ["Общее\\02_Что_такое_Crossplat.txt"] },
  { href: "/general/smart-planner", tab: "general", sidebarLabel: "Что такое Smart-Planner", title: "Что такое Smart-Planner", docKeys: ["Общее\\03_Что_такое_Smart_Planner.txt"] },
  { href: "/general/karpik", tab: "general", sidebarLabel: "Что такое Karpik", title: "Что такое Karpik", docKeys: ["Общее\\04_Что_такое_Karpik.txt"] },
  {
    href: "/general/api",
    tab: "general",
    sidebarLabel: "Работа с API",
    title: "Работа с API",
    docKeys: ["Общее\\05_Работа_с_API.txt", "API\\01_Единая_модель_API_ключей.txt"],
  },
  { href: "/general/requests", tab: "general", sidebarLabel: "Запросы", title: "Запросы", docKeys: ["Общее\\06_Запросы.txt"] },
  { href: "/general/results", tab: "general", sidebarLabel: "Результаты", title: "Результаты", docKeys: ["Общее\\07_Результаты.txt"] },
  { href: "/general/scenarios", tab: "general", sidebarLabel: "Практические сценарии", title: "Практические сценарии", docKeys: ["Общее\\08_Практические_сценарии.txt"] },
  { href: "/general/products", tab: "general", sidebarLabel: "Обзор продуктов", title: "Обзор продуктов", docKeys: ["Общее\\09_Обзор_продуктов.txt"] },
  { href: "/general/faq", tab: "general", sidebarLabel: "Частые вопросы", title: "Частые вопросы", docKeys: ["Общее\\10_Частые_вопросы.txt"] },

  { href: "/crossplat", tab: "crossplat", sidebarLabel: "Обзор", title: "Crossplat", docKeys: ["Crossplat\\01_Обзор.txt"] },
  { href: "/crossplat/what-is", tab: "crossplat", sidebarLabel: "Что такое Crossplat", title: "Что такое Crossplat", docKeys: ["Crossplat\\02_Что_такое_Crossplat.txt"] },
  { href: "/crossplat/api", tab: "crossplat", sidebarLabel: "Обзор API", title: "Обзор API Crossplat", docKeys: ["Crossplat\\03_Обзор_API.txt"] },
  { href: "/crossplat/machines", tab: "crossplat", sidebarLabel: "Машины", title: "Машины", docKeys: ["Crossplat\\04_Машины.txt"] },
  { href: "/crossplat/tasks", tab: "crossplat", sidebarLabel: "Задачи", title: "Задачи", docKeys: ["Crossplat\\05_Задачи.txt"] },
  { href: "/crossplat/results", tab: "crossplat", sidebarLabel: "Результаты", title: "Результаты", docKeys: ["Crossplat\\06_Результаты.txt"] },
  { href: "/crossplat/security", tab: "crossplat", sidebarLabel: "Методы защиты", title: "Методы защиты", docKeys: ["Crossplat\\07_Методы_защиты.txt"] },
  { href: "/crossplat/scenarios", tab: "crossplat", sidebarLabel: "Практические сценарии", title: "Практические сценарии", docKeys: ["Crossplat\\08_Практические_сценарии.txt"] },
  { href: "/crossplat/reference", tab: "crossplat", sidebarLabel: "Все маршруты", title: "Все маршруты", docKeys: ["Crossplat\\09_Все_маршруты.txt"] },
  { href: "/crossplat/faq", tab: "crossplat", sidebarLabel: "Частые вопросы", title: "Частые вопросы", docKeys: ["Crossplat\\10_Частые_вопросы.txt"] },

  { href: "/smart-planner", tab: "smart-planner", sidebarLabel: "Обзор", title: "Smart-Planner", docKeys: ["Smart-Planner\\01_Обзор.txt"] },
  { href: "/smart-planner/what-is", tab: "smart-planner", sidebarLabel: "Что такое Smart-Planner", title: "Что такое Smart-Planner", docKeys: ["Smart-Planner\\02_Что_такое_Smart_Planner.txt"] },
  { href: "/smart-planner/api", tab: "smart-planner", sidebarLabel: "Обзор API", title: "Обзор API Smart-Planner", docKeys: ["Smart-Planner\\03_Обзор_API.txt"] },
  { href: "/smart-planner/events", tab: "smart-planner", sidebarLabel: "События и календарь", title: "События и календарь", docKeys: ["Smart-Planner\\04_События_и_календарь.txt"] },
  { href: "/smart-planner/routes", tab: "smart-planner", sidebarLabel: "Маршруты и выполнимость", title: "Маршруты и выполнимость", docKeys: ["Smart-Planner\\05_Маршруты_и_выполнимость.txt"] },
  { href: "/smart-planner/security", tab: "smart-planner", sidebarLabel: "Уведомления и 2FA", title: "Уведомления и 2FA", docKeys: ["Smart-Planner\\06_Уведомления_и_2FA.txt"] },
  { href: "/smart-planner/ai", tab: "smart-planner", sidebarLabel: "AI и автоматизация", title: "AI и автоматизация", docKeys: ["Smart-Planner\\07_AI_и_автоматизация.txt"] },
  { href: "/smart-planner/scenarios", tab: "smart-planner", sidebarLabel: "Практические сценарии", title: "Практические сценарии", docKeys: ["Smart-Planner\\08_Практические_сценарии.txt"] },
  { href: "/smart-planner/reference", tab: "smart-planner", sidebarLabel: "Все маршруты", title: "Все маршруты", docKeys: ["Smart-Planner\\09_Все_маршруты.txt"] },
  { href: "/smart-planner/faq", tab: "smart-planner", sidebarLabel: "Частые вопросы", title: "Частые вопросы", docKeys: ["Smart-Planner\\10_Частые_вопросы.txt"] },

  { href: "/karpik", tab: "karpik", sidebarLabel: "Обзор", title: "Karpik", docKeys: ["Karpik\\01_Обзор.txt"] },
  { href: "/karpik/what-is", tab: "karpik", sidebarLabel: "Что такое Karpik", title: "Что такое Karpik", docKeys: ["Karpik\\02_Что_такое_Karpik.txt"] },
  { href: "/karpik/api", tab: "karpik", sidebarLabel: "Обзор API", title: "Обзор API Karpik", docKeys: ["Karpik\\03_Обзор_API.txt"] },
  { href: "/karpik/desktop", tab: "karpik", sidebarLabel: "Desktop и локальная работа", title: "Desktop и локальная работа", docKeys: ["Karpik\\04_Desktop_и_локальная_работа.txt"] },
  { href: "/karpik/server", tab: "karpik", sidebarLabel: "Сервер и бот", title: "Сервер и бот", docKeys: ["Karpik\\05_Сервер_и_бот.txt"] },
  { href: "/karpik/pairing", tab: "karpik", sidebarLabel: "Сопряжение и команды", title: "Сопряжение и команды", docKeys: ["Karpik\\06_Сопряжение_и_команды.txt"] },
  { href: "/karpik/releases", tab: "karpik", sidebarLabel: "Обновления и релизы", title: "Обновления и релизы", docKeys: ["Karpik\\07_Обновления_и_релизы.txt"] },
  { href: "/karpik/scenarios", tab: "karpik", sidebarLabel: "Практические сценарии", title: "Практические сценарии", docKeys: ["Karpik\\08_Практические_сценарии.txt"] },
  { href: "/karpik/reference", tab: "karpik", sidebarLabel: "Все маршруты", title: "Все маршруты", docKeys: ["Karpik\\09_Все_маршруты.txt"] },
  { href: "/karpik/faq", tab: "karpik", sidebarLabel: "Частые вопросы", title: "Частые вопросы", docKeys: ["Karpik\\10_Частые_вопросы.txt"] },
];

export const DOCS_ALIAS_MAP: Record<string, string> = {
  "/": "/general",
  "/getting-started": "/general",
  "/api": "/general/api",
  "/guides": "/general/scenarios",
  "/reference": "/crossplat/reference",
  "/products": "/general/products",
  "/faq": "/general/faq",
};

export function resolveDocsPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return DOCS_ALIAS_MAP[normalized] ?? normalized;
}

export function getDocsPage(pathname: string): DocsPage {
  const resolved = resolveDocsPath(pathname);
  return DOCS_PAGES.find((page) => page.href === resolved) ?? DOCS_PAGES[0];
}

export function getSidebarPages(tab: DocsTopTabKey): DocsPage[] {
  return DOCS_PAGES.filter((page) => page.tab === tab);
}

export function getDocText(key: DocTextKey): string {
  return DOC_TEXTS[key];
}
