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
    description: "Рабочий продукт для управления агентами, машинами, задачами, логами и результатами.",
    status: "active" as const,
  },
  {
    name: "Smart-Planner",
    href: "https://smart-planner.nerior.store",
    description: "Отдельный продукт планирования. Сейчас не доступен публично.",
    status: "disabled" as const,
  },
  {
    name: "Karpik",
    href: "https://karpik.nerior.store",
    description: "Отдельный продукт аналитики и вспомогательных сценариев. Сейчас не доступен публично.",
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
      { label: "О нас", href: "/company#about", note: "О компании и её подходе" },
      { label: "Карьера", href: "/company#careers", note: "Команда, роли и рост" },
      { label: "Истории", href: "/company#stories", note: "Контекст, продукты и развитие" },
    ],
  },
  {
    label: "Разработчикам",
    href: "https://docs.nerior.store",
    menu: [
      { label: "API", href: "https://api.nerior.store", note: "Ключи доступа, scopes и usage" },
      { label: "Документация", href: "https://docs.nerior.store", note: "Структура и материалы" },
      { label: "Руководства", href: "https://docs.nerior.store/guides", note: "Практические сценарии" },
      { label: "Сообщество", href: "https://community.nerior.store", note: "Открытые обсуждения и анонсы" },
    ],
  },
];

export const UPDATE_CATEGORIES = ["Все", "Публикации", "Анонсы", "Интеграции", "Релизы"] as const;

export const DOCS_PILLARS = [
  {
    title: "Структура платформы",
    body:
      "Документация разделена по ролям и поверхностям: публичный сайт, рабочий продукт Crossplat, API-кабинет, справочный центр и открытое сообщество.",
  },
  {
    title: "Практические сценарии",
    body:
      "Материалы описывают не только интерфейсы, но и реальные действия: как подключиться, как запустить задачу, как прочитать логи и как получить результат.",
  },
  {
    title: "Reference и маршруты",
    body:
      "Внутри docs есть разделы с маршрутами внешнего API, правилами доступа, описанием ключей и структурой типовых интеграций.",
  },
] as const;

export const DOCS_SECTIONS = [
  {
    slug: "getting-started",
    title: "Начало работы",
    body:
      "Этот раздел объясняет, как устроена экосистема Nerior, какие домены отвечают за продукт, документацию, API и поддержку, и с чего начинать знакомство новым пользователям и командам.",
  },
  {
    slug: "crossplat",
    title: "Crossplat",
    body:
      "Здесь описывается основной рабочий продукт: подключение машины, запуск задач, просмотр логов, чтение результатов, распределение доступа и рабочие сценарии команды.",
  },
  {
    slug: "api",
    title: "API и интеграции",
    body:
      "Раздел для разработчиков с описанием авторизации через API-ключи, ограничений доступа, внешних маршрутов, продуктовых scopes и базовых схем интеграции.",
  },
  {
    slug: "guides",
    title: "Руководства",
    body:
      "Пошаговые инструкции для частых сценариев: первый запуск, запуск задачи через API, экспорт результата, чтение логов, подключение команды и разбор типовых ошибок.",
  },
  {
    slug: "reference",
    title: "Справочник",
    body:
      "Полный reference по внешним маршрутам: список endpoint-ов, методы, описание результата, ожидания по авторизации и связи между сущностями.",
  },
  {
    slug: "faq",
    title: "FAQ",
    body:
      "Короткие ответы на частые вопросы по продукту, API, доступу, структуре аккаунта, сценариям поддержки и маршрутам эскалации.",
  },
] as const;

export const DOCS_LIBRARY_GROUPS = [
  {
    title: "Product Guides",
    items: [
      "Поток первого входа в экосистему и выбор нужной поверхности.",
      "Рабочие сценарии Crossplat для одиночного пользователя и команды.",
      "Логика переходов между публичным сайтом, docs, API и support-поверхностями.",
    ],
  },
  {
    title: "API Reference",
    items: [
      "Аутентификация через API-ключи и продуктовые ограничения.",
      "Маршруты внешнего API для машин, задач, логов и результатов.",
      "Примеры запросов и ожидаемых ответов для интеграций.",
    ],
  },
  {
    title: "Operations",
    items: [
      "Практические инструкции по диагностике и чтению состояний.",
      "Маршруты в help center и support-контур.",
      "Навигация по связанным разделам и публичным материалам.",
    ],
  },
] as const;

export const COMMUNITY_PILLARS = [
  {
    title: "Анонсы",
    body: "Публичные сообщения о запуске материалов, обновлениях, релизах и новых направлениях экосистемы Nerior.",
  },
  {
    title: "Обсуждения",
    body: "Открытая зона для вопросов, обратной связи и обсуждения продуктовых и технических сценариев.",
  },
  {
    title: "Материалы",
    body: "Ссылки на docs, help, обновления и другие публичные слои, чтобы не смешивать разные типы контента в одном месте.",
  },
] as const;

export const COMMUNITY_SECTIONS = [
  {
    title: "Контентный поток",
    body:
      "Community связывает анонсы, публикации и открытые обсуждения. Контент в него приходит из раздела обновлений, а подробные технические материалы уводятся в docs.",
  },
  {
    title: "Обратная связь",
    body:
      "Здесь должны жить внешние обсуждения, вопросы пользователей и маршруты к более формальной заявке через форму связи на основном сайте.",
  },
  {
    title: "Открытый архив",
    body:
      "Страница должна быть готова под будущие публикации, подборки материалов, ссылки на релизы и другие внешние активности команды.",
  },
] as const;

export const COMMUNITY_CHANNELS = [
  {
    title: "Публикации и анонсы",
    body:
      "Главный контентный слой с новостями и статьями остаётся на nerior.store/updates, а community переиспользует его как открытую точку входа в материалы.",
  },
  {
    title: "Документация",
    body:
      "Техническое содержание уходит в docs.nerior.store, чтобы анонсы и обсуждения не превращались в перегруженную базу знаний.",
  },
  {
    title: "Support-контур",
    body:
      "Частые вопросы и маршруты помощи живут в help.nerior.store, а community служит публичной точкой для дальнейшего перехода.",
  },
] as const;

export const HELP_PILLARS = [
  {
    title: "Быстрый старт",
    body:
      "Объяснение, куда идти новому пользователю: публичный сайт, Crossplat, docs, API или форма связи в зависимости от задачи.",
  },
  {
    title: "Диагностика",
    body:
      "Путь для тех, кто уже столкнулся с вопросом по продукту, доступу, интеграции или маршрутизации между поверхностями.",
  },
  {
    title: "Поддержка",
    body:
      "Ясное разделение между self-service материалами, community и прямой заявкой через форму связи.",
  },
] as const;

export const HELP_SECTIONS = [
  {
    title: "Первый вход",
    body:
      "Если вы только знакомитесь с Nerior, начните с главного сайта, затем выберите нужную поверхность: Crossplat для работы, docs для чтения материалов, API для ключей и help для быстрых ответов.",
  },
  {
    title: "Аккаунт и доступ",
    body:
      "Crossplat и API используют общую учётную запись, но отдельные пользовательские сценарии и отдельные сессии. Это важно для понимания входа и последующей навигации.",
  },
  {
    title: "Crossplat",
    body:
      "Для продуктовых вопросов по машинам, задачам, логам и результатам основной маршрут ведёт в сам Crossplat, а справочный центр подсказывает, где искать нужный раздел.",
  },
  {
    title: "API",
    body:
      "Для доступа к ключам, scopes, ограничениям и аналитике используйте api.nerior.store, а для полного описания маршрутов и примеров переходите в docs.",
  },
] as const;

export const HELP_GROUPS = [
  {
    title: "Для новых пользователей",
    items: [
      "Куда перейти в первую очередь и как устроены домены Nerior.",
      "Когда нужен Crossplat, а когда docs, help или API-кабинет.",
      "Как найти форму связи и как задать корректный запрос.",
    ],
  },
  {
    title: "Для команд",
    items: [
      "Как объяснить структуру сервисов внутри компании.",
      "Где читать документацию и как вести технические интеграции.",
      "Как различаются продуктовый вход и API-доступ.",
    ],
  },
  {
    title: "Для поддержки",
    items: [
      "Когда достаточно help center, а когда нужен docs или community.",
      "Как маршрутизировать пользователя в форму связи.",
      "Какие поверхности отвечают за какой тип вопроса.",
    ],
  },
] as const;

export const NERIOR_METRICS = [
  { label: "Продукты", value: "3" },
  { label: "Публичные поверхности", value: "6" },
  { label: "Слой для разработчиков", value: "3" },
  { label: "Фокус", value: "Инфраструктура" },
] as const;

export function getPublicTitle(_kind: HostAppKind): string {
  return "Nerior";
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
