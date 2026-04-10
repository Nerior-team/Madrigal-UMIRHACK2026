# Frontend Product Foundation Design

## Goal

Довести `Predict MV` до состояния цельного продукта, а не набора частично связанных экранов. В этом срезе фронтенд и backend развиваются вместе там, где текущих контрактов не хватает для реального пользовательского сценария.

Итоговая цель:
- полноценные роуты вместо псевдо-одностраничного поведения
- безопасная web-auth модель на серверных cookie-session
- единый каркас интерфейса с глобальным поиском, модалками, пагинацией и предсказуемой навигацией
- рабочие продуктовые сценарии для машин, задач, логов, результатов, доступа, профиля, 2FA, сессий, уведомлений и API keys
- никаких моков и фиктивных данных; только реальные backend-ответы

## Scope

В этот большой frontend-срез входят:
- роутинг и app shell
- web auth, session bootstrap и refresh-safe поведение
- глобальный поиск
- страницы `dashboard`, `machines`, `machine detail`, `tasks`, `results`, `logs`, `access`, `reports`, `profile`
- pairing машины из интерфейса
- task creation и command/template UX
- console/log viewer
- profile, password change, 2FA, active sessions
- site notifications + Telegram notification preferences
- API keys UI
- dark theme
- нужные backend-расширения под перечисленные сценарии

В этот срез не входят:
- отдельный developer portal на `platform.nerior.store`
- новый desktop UI-клиент
- любые mock screens или временные данные

## Product Constraints

- Основной визуальный стиль сохраняется близким к текущему продукту.
- Боковая панель и верхняя панель видны на всех app-страницах.
- Breadcrumbs в стиле `домик -> Машины -> ...` не используются.
- Все кликабельные элементы получают единый motion-layer: hover, press, active, open/close.
- Данные не должны визуально разрушать layout: длинные названия, email, команды и логи обязаны оставаться читаемыми.
- Все тексты и исходники фронтенда должны оставаться в `UTF-8`.
- Авторизация в вебе должна переживать refresh страницы.
- Безопасность доступа определяется backend; фронт не должен открывать чужие данные только по URL.

## User Roles and Capability Model

### Viewer

Может просматривать разрешённые машины, задачи, результаты, логи и отчёты.

### Operator

Может запускать только разрешённые владельцем или администратором команды и шаблоны на доступных машинах. Не может создавать кастомные команды.

### Admin

Может управлять доступом, приглашениями, командами, параметрами и задачами на доступных машинах. Может создавать кастомные команды и использовать их.

### Owner

Имеет полный контроль над своей машиной, включая retention удалённых машин, доступ, кастомные команды и API keys.

Все ролевые ограничения выполняются только на backend. Фронт лишь отражает доступные действия и корректно обрабатывает `403`, `404` и другие запреты.

## Navigation and Routing

### Top-Level Layout

Приложение делится на два корневых layout:
- `AuthLayout`
- `AppLayout`

`AuthLayout` содержит только auth-related экраны.

`AppLayout` содержит:
- фиксированную левую панель
- фиксированную верхнюю панель с глобальным поиском
- область контента с собственным вертикальным scroll
- route-aware модалки

### Auth Routes

- `/login`
- `/register`
- `/confirm`
- `/forgot-password`
- `/reset-password`

### App Routes

- `/`
- `/dashboard`
- `/machines`
- `/machines/add`
- `/machines/:machineId`
- `/machines/:machineId/logs/:taskId`
- `/machines/:machineId/results/:resultId`
- `/tasks`
- `/tasks/:taskId`
- `/tasks/:taskId/logs`
- `/results`
- `/results/:resultId`
- `/logs`
- `/access`
- `/reports`
- `/profile`
- `/profile/api-keys`

### Modal Routes

Часть детальных сценариев открывается как роут-модалка поверх текущей страницы:
- просмотр логов конкретной задачи
- просмотр результата конкретной задачи
- confirm dialogs для опасных действий
- часть task-related flows

Это даёт:
- deep-link
- нормальный `back/forward`
- корректное поведение при refresh
- отсутствие визуального отрыва пользователя от текущего контекста

## Web Auth and Session Model

### Browser Auth

Веб-клиент переходит на серверную `cookie-session` модель:
- сервер выдаёт web-session в cookie
- фронт не хранит bearer token в `localStorage`
- bootstrap приложения делает `GET /api/v1/auth/me`
- валидная сессия восстанавливает интерфейс после refresh
- истёкшая сессия уводит пользователя на auth routes

### Session Lifetime

Целевой срок жизни web-сессии: `3 дня`.

### Active Sessions

Появляется отдельный блок активных сессий в профиле:
- список текущих и других сессий
- device/user-agent/ip/created_at/last_seen_at
- завершение других сессий

Ограничение:
- новая сессия не может завершать другие сессии в течение `24 часов`
- старые доверенные сессии в это время всё ещё могут завершать другие

### Auth Flows

Фронтенд должен полноценно поддерживать:
- register
- email confirm
- login
- logout
- forgot password
- reset password
- TOTP 2FA
- Telegram 2FA

## Global Search

### Purpose

Поиск становится глобальным продуктовым входом, а не фильтром отдельной страницы.

### Search Sources

В первой версии поиск охватывает:
- машины
- группы
- задачи
- результаты
- пункты меню
- ключевые поля машины: hostname, display name, OS, status

### UX

Во время ввода открывается кастомный dropdown в стиле продукта:
- секции по типам сущностей
- лучшие совпадения сверху
- поддержка неполного совпадения
- навигация клавиатурой
- переход по `Enter`

### Search Result Targets

- машина -> `/machines/:machineId`
- задача -> `/tasks/:taskId`
- результат -> `/results/:resultId`
- пункт меню -> соответствующий app-route

При необходимости допускается backend-агрегатор поиска, если текущие клиентские выборки окажутся недостаточны для качества или производительности.

## Shared UI Foundation

### Shared Components

Каркас интерфейса выносится в общие primitives:
- `AppShell`
- `Sidebar`
- `Topbar`
- `SearchCommand`
- `DataTable`
- `FilterBar`
- `Pagination`
- `StatusBadge`
- `EmptyState`
- `ConfirmModal`
- `ConsoleModal`
- `CustomSelect`
- `DateRangePicker`
- `SectionCard`
- `FormField`

### Motion

Вся интерактивность получает единый motion-language:
- hover
- press
- selected/active
- route transitions
- modal transitions
- dropdown transitions
- smooth scroll areas

### Data Robustness

Shared UI обязан нормально переживать:
- длинные machine names
- длинные команды
- длинные email
- длинные логи
- пустые состояния
- error states
- stale/offline entities

## Dashboard

Главный экран становится аккуратным продуктовым dashboard без смены общего визуального направления.

Содержимое строится на реальных данных:
- число машин
- online/offline/running breakdown
- активные задачи
- ошибки
- недавние результаты
- краткие аналитические блоки

Позже сюда же ложится dark theme без нового глобального редизайна.

## Machines

### Machines List

Страница машин получает:
- корректный расчёт статусов по heartbeat и task state
- корректное распознавание offline машин
- нормальное отображение перепривязанных машин
- поиск и фильтры
- пагинацию
- серую секцию или фильтр для `Удалённых`

### Add Machine Flow

Привязка машины живёт на `Машины -> Добавить машину`.

Сценарий:
1. Пользователь открывает экран `Добавить машину`
2. Видит короткую инструкцию:
   - скачать агент
   - выполнить `predict pair`
   - ввести `device code`
3. Вводит `device code`
4. Подтверждает привязку
5. Видит статус подтверждения

Будущий daemon UX:
- `predict pair`
- `predict help`
- `predict -help`

### Deleted Machines Retention

В профиле появляется настройка хранения удалённых машин:
- не хранить
- неделя
- месяц
- 3 месяца
- 6 месяцев
- год
- не удалять

По умолчанию: `1 месяц`.

После отвязки или удаления машина попадает в `Удалённые` и хранится в рамках этой политики.

## Machine Detail

### Canonical Page

Роут: `/machines/:machineId`

Вторичные подвкладки убираются. Всё собирается на одном экране:
- обзор
- свойства машины
- создание задачи
- недавние задачи
- результаты
- логи

### Layout Rules

- никаких плавающих блоков
- равномерное распределение по сетке
- минимум пустого воздуха
- длинные значения не ломают карточки

### Task Creation Block

Создание задачи на странице машины доступно только тем, у кого есть нужные права.

Сценарии:
- свободный ввод команды
- выбор разрешённой команды через dropdown/autocomplete

Поддержка:
- параметры команды
- live preview console
- `sudo` только там, где допустимо
- `Bash` label для Linux
- `Shell` label для Windows
- `Сбросить`
- `Добавить` или `Отправить` в зависимости от роли и сценария

### Live Preview Console

Превью собирается из реальных данных формы:
- команда
- параметр
- `sudo`, если разрешено и выбрано

Никаких моков. Только композиция реального payload в readable preview.

## Tasks

### Tasks Page

Страница задач получает:
- корректную русификацию
- фильтры по датам, задачам, машинам
- пагинацию
- корректные статусы

### Statuses

Обязательные группы:
- `В процессе`
- `В очереди`
- `Завершённые`
- `Ошибки`

Если задача завершена администратором или владельцем, это должно отображаться как нормальное завершение с пояснением, а не как безликая ошибка.

### Machine Naming

Вместо внутренних численных идентификаторов показываются нормальные machine display names.

## Logs

### Logs Page

Логи перестают быть мусорным общим потоком и становятся структурированным экраном с привязкой к:
- машине
- задаче

### Visual Model

Основной viewer — консольного вида:
- красивый тёмный скроллируемый блок
- фиксированная высота
- собственный scroll
- нормальный перенос длинных строк
- timestamps и device/task context

### Entry Points

Везде, где есть действие `Посмотреть логи`, переход идёт в лог этой конкретной задачи. Канонически это route-modal.

### List Presentation

Если на странице есть таблица логов, она показывает:
- понятное название задачи
- email пользователя вместо технического user id, если email есть в данных
- статус
- дату
- действие открыть консоль

## Results

### Results Page

Результаты получают:
- корректные dropdown labels
- фильтры по статусу, машине, команде
- date range picker `от` / `до`
- пагинацию

### Result Detail

Результат конкретной задачи открывается детальным роутом или route-modal. Оттуда доступен связанный просмотр логов.

### Cancel Semantics

Если задача отменена администратором, владельцем или оператором, это явно отображается в result/log context, а не выглядит как внезапный обрыв.

## Access and Invitations

Страница `Доступ` должна поддерживать:
- список доступов по машине
- список приглашений
- смену роли
- revoke
- создание приглашения

Creator-owner ограничения сохраняются на backend. Фронт лишь не предлагает невозможные действия и корректно показывает backend-error.

## Reports

Отчёты остаются частью основного продукта, но получают полноценную аналитическую подачу:
- success rate
- error count
- average duration
- machine activity
- task distribution

Графики строятся на реальных backend-данных, без фиктивной аналитики.

## Profile

### Profile Basics

Профиль получает рабочие поля:
- имя
- фамилия
- фото
- telegram link status
- deleted machines retention

Надпись в sidebar больше не называется `Фамилия`.

### Password Change

Отдельная форма:
- старый пароль
- новый пароль
- подтверждение нового пароля

Правило валидации:
- минимум `12` символов
- хотя бы `1` латинская буква
- хотя бы `1` цифра
- хотя бы `1` спецсимвол
- нельзя совпадать с email
- нельзя совпадать с текущим паролем

Под полем показывается realtime checklist.

### Two-Factor Authentication

UI поддерживает:
- TOTP setup / confirm / disable
- Telegram 2FA setup / confirm / disable

## Notifications

### Channels

Первая версия уведомлений:
- on-site notifications
- Telegram notifications

### Required Events

- задача завершилась успешно
- задача завершилась ошибкой
- задачу отменили
- новая машина ожидает подтверждения
- новый вход / 2FA запрос
- вас пригласили к машине
- у вас отозвали доступ к машине

### Preferences

В профиле пользователь может выбрать, какие события и через какие каналы он хочет получать.

## API Keys

API keys получают отдельный route:
- `/profile/api-keys`

Причина:
- это часть аккаунта и интеграций пользователя
- это не ежедневная операторская навигация

Экран включает:
- список ключей
- права `read/run`
- scope по машинам
- scope по шаблонам команд
- expiry
- usage limit
- revoke
- модалку создания с одноразовым показом секрета

Отдельный developer portal и поддомен `platform.nerior.store` в этот срез не входят.

## Dark Theme

Тёмная тема включается как часть общей theme-system:
- light/dark switch
- общие tokens
- без отдельного продуктового редизайна

## Backend Extensions Required

Этот frontend-срез требует новых backend-контрактов:
- cookie-session web auth adjustments
- session listing/revoke endpoints
- password change endpoint
- profile update endpoint
- avatar upload endpoint
- notifications list / mark-read / preferences endpoints
- deleted machines retention preference
- расширенный machine lifecycle для `Удалённых`
- при необходимости aggregated search endpoint

Также нужно проверить и при необходимости расширить:
- task naming
- cancel actor metadata
- task/result/log filters
- machine display data для страниц и поиска

## Data and Security Notes

- URL никогда не является основанием для доступа к данным.
- Все чувствительные действия опираются на backend permissions и backend errors.
- Фронт обязан корректно отрабатывать `401`, `403`, `404`, `409`.
- Никаких bearer token в `localStorage` для веба.
- Никаких моков для экранов, графиков или поиска.

## Implementation Strategy

### Batch 1: Foundation

- real routing
- AppShell
- cookie-session web auth
- session bootstrap
- global search
- shared components
- pagination
- modal routes
- UTF-8 cleanup

### Batch 2: Core Operations

- machines
- add machine flow
- machine detail
- task creation
- tasks
- logs console
- results
- access/invites

### Batch 3: Account and Analytics

- profile
- password change
- 2FA
- active sessions
- notifications
- API keys
- reports
- dark theme

## Verification Strategy

### Local Verification

Каждый батч проверяется локально:
- frontend build
- targeted frontend tests
- browser smoke against real backend
- API smoke for new backend endpoints

### Manual Product Verification

Обязательные ручные сценарии:
- login -> refresh -> session alive
- pair machine from `Машины -> Добавить машину`
- create task -> logs -> result
- open logs from tasks/results/machine page
- invite user -> access update -> revoke
- change password
- enable and disable 2FA
- view and revoke sessions
- create and revoke API key
- read and mark notifications

### Delivery Rule

- всё тестируется локально
- изменения пушатся в git по мере завершения больших срезов
- на сервер ничего не выкатывается без явного подтверждения пользователя

## Acceptance Criteria

Срез считается успешным, если:
- приложение использует реальные маршруты и переживает refresh
- web auth держится на cookie-session и не выкидывает пользователя без причины
- поиск находит сущности по живым данным
- машины, задачи, логи и результаты больше не ломают layout
- логи выглядят как консоль и открываются из всех нужных точек
- страница машины собирает основной machine-scoped workflow в одном месте
- профиль, безопасность, 2FA, сессии, уведомления и API keys реально работают
- все таблицы и списки имеют пагинацию
- нет битой кодировки и placeholder UX
- нет моков
