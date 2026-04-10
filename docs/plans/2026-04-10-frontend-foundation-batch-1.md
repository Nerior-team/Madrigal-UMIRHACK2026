# Frontend Foundation Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `Predict MV` frontend с псевдо-одностраничного режима на нормальный route-driven web-клиент с cookie-session auth, стабильным refresh, глобальным поиском, shared UI foundation и корректной UTF-8 базой.

**Architecture:** Batch 1 намеренно ограничен foundation-слоем. Сначала выносим routing, session bootstrap, shared layout и общие primitives, затем подключаем cookie-based HTTP client и global search, после чего мигрируем текущие экраны на новый каркас без полного product polish. Backend меняем только там, где это требуется для безопасной web-session на `3 дня`; machine/task/account feature contracts этого батча не переписываются.

**Tech Stack:** React 18, React Router 6, TypeScript, Vite, Vitest, FastAPI, cookie-session auth, CSRF header flow

---

## Scope Boundary

Этот план покрывает только `Batch 1: Foundation` из утверждённой spec.

В этот план входят:
- реальные маршруты и вложенные layout
- постоянный `AppShell`
- cookie-session web auth и bootstrap через `/api/v1/auth/me`
- `3-day` web session TTL
- CSRF-aware HTTP client
- глобальный поиск с красивым dropdown
- shared UI primitives для таблиц, фильтров, пагинации и модалок
- UTF-8 cleanup и вынос route/helpers из монолитного `App.tsx`

В этот план не входят:
- pairing flow
- machine detail redesign
- logs console UX
- task creation redesign
- access/invite polish
- profile / 2FA / notifications / API keys UI
- reports redesign

Эти части должны быть оформлены отдельными планами `Batch 2` и `Batch 3` после принятия foundation.

## File Structure Lock-In

### Frontend Files

**Keep and slim down:**
- `server/Frontend/src/App.tsx`
- `server/Frontend/src/main.tsx`
- `server/Frontend/src/styles.css`
- `server/Frontend/src/core/api.ts`
- `server/Frontend/src/core/routes.ts`
- `server/Frontend/src/core/ui.ts`

**Create:**
- `server/Frontend/src/app/router.tsx`
- `server/Frontend/src/app/route-constants.ts`
- `server/Frontend/src/app/route-modals.ts`
- `server/Frontend/src/app/auth-session.ts`
- `server/Frontend/src/components/layout/AppShell.tsx`
- `server/Frontend/src/components/layout/AuthLayout.tsx`
- `server/Frontend/src/components/layout/Sidebar.tsx`
- `server/Frontend/src/components/layout/Topbar.tsx`
- `server/Frontend/src/components/search/GlobalSearch.tsx`
- `server/Frontend/src/components/primitives/Pagination.tsx`
- `server/Frontend/src/components/primitives/CustomSelect.tsx`
- `server/Frontend/src/components/primitives/ModalFrame.tsx`
- `server/Frontend/src/components/primitives/StatusBadge.tsx`
- `server/Frontend/src/components/primitives/EmptyState.tsx`
- `server/Frontend/src/core/http.ts`
- `server/Frontend/src/core/cookies.ts`
- `server/Frontend/src/core/search.ts`
- `server/Frontend/src/core/pagination.ts`
- `server/Frontend/src/test/setup.ts`
- `server/Frontend/src/app/router.test.tsx`
- `server/Frontend/src/core/search.test.ts`
- `server/Frontend/src/core/pagination.test.ts`
- `server/Frontend/src/core/http.test.ts`

### Backend Files

**Modify only:**
- `server/Backend/app/core/config.py`
- `server/Backend/app/core/security.py`
- `server/Backend/app/domains/auth/sessions.py`
- `server/Backend/app/api/v1/auth.py`

**Optional only if required by implementation shape:**
- `server/Backend/app/domains/auth/schemas.py`

### Responsibility Split

- `App.tsx` becomes a thin composition root, not the place where all route parsing and page state lives.
- `router.tsx` owns route tree and route-modal plumbing.
- `auth-session.ts` owns `me/bootstrap/logout` orchestration for web.
- `http.ts` owns `credentials: include`, CSRF injection and API error normalization.
- `search.ts` owns global search ranking logic.
- `pagination.ts` owns pure pagination math.
- `styles.css` remains the global style source, but foundation animations and shell rules move there in organized sections instead of page-specific hacks.

---

### Task 1: Frontend Test Harness and Route Baseline

**Files:**
- Modify: `server/Frontend/package.json`
- Modify: `server/Frontend/vite.config.ts`
- Modify: `server/Frontend/tsconfig.json`
- Create: `server/Frontend/src/test/setup.ts`
- Create: `server/Frontend/src/app/router.test.tsx`
- Modify: `server/Frontend/src/core/routes.ts`
- Modify: `server/Frontend/src/core/routes.test.ts`

- [ ] **Step 1: Add browser-like component test support**

Update `server/Frontend/package.json` devDependencies so route and shell behavior can be tested in `jsdom`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: Configure Vitest for jsdom**

Modify `server/Frontend/vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

- [ ] **Step 3: Add failing route resolution tests for the new canonical paths**

Create `server/Frontend/src/core/routes.test.ts` coverage for:
- `/dashboard`
- `/machines/add`
- `/machines/:machineId`
- `/machines/:machineId/logs/:taskId`
- `/tasks/:taskId`
- `/tasks/:taskId/logs`
- `/results/:resultId`
- `/profile/api-keys`

Example test case:

```ts
it("resolves machine task logs modal route", () => {
  expect(resolveAppRoute("/machines/m-1/logs/t-1")).toEqual({
    section: "workspace",
    workspaceTab: "machines",
    machineId: "m-1",
    modal: { kind: "machine-task-logs", taskId: "t-1" },
  });
});
```

- [ ] **Step 4: Add a failing router rendering test**

Create `server/Frontend/src/app/router.test.tsx` that renders the router in memory and proves:
- auth routes use auth layout
- workspace routes use app shell
- unknown route redirects to `/machines`

Minimal test shape:

```tsx
render(
  <MemoryRouter initialEntries={["/machines"]}>
    <App />
  </MemoryRouter>,
);
expect(screen.getByRole("navigation", { name: /sidebar/i })).toBeInTheDocument();
```

- [ ] **Step 5: Run tests to verify they fail for the right reason**

Run:

```bash
cd server/Frontend
npm run test -- src/core/routes.test.ts src/app/router.test.tsx
```

Expected:
- failing assertions about unresolved routes and missing router/app shell split

- [ ] **Step 6: Extend route model and route helpers minimally**

Modify `server/Frontend/src/core/routes.ts` so it can represent:
- canonical app routes
- route-modal metadata
- add-machine route
- profile api-keys route

Keep it as pure parsing/formatting logic with no React imports.

- [ ] **Step 7: Re-run tests**

Run:

```bash
cd server/Frontend
npm run test -- src/core/routes.test.ts
```

Expected:
- `routes.test.ts` passes
- `router.test.tsx` still fails until router extraction exists

- [ ] **Step 8: Commit**

```bash
git add server/Frontend/package.json server/Frontend/package-lock.json server/Frontend/vite.config.ts server/Frontend/tsconfig.json server/Frontend/src/test/setup.ts server/Frontend/src/core/routes.ts server/Frontend/src/core/routes.test.ts server/Frontend/src/app/router.test.tsx
git commit -m "test: add frontend route foundation harness"
```

---

### Task 2: Cookie-Session Web Auth Foundation

**Files:**
- Modify: `server/Backend/app/core/config.py`
- Modify: `server/Backend/app/core/security.py`
- Modify: `server/Backend/app/domains/auth/sessions.py`
- Modify: `server/Backend/app/api/v1/auth.py`
- Create: `server/Frontend/src/core/cookies.ts`
- Create: `server/Frontend/src/core/http.ts`
- Create: `server/Frontend/src/core/http.test.ts`
- Create: `server/Frontend/src/app/auth-session.ts`
- Modify: `server/Frontend/src/core/api.ts`

- [ ] **Step 1: Add a dedicated web session TTL setting**

Modify `server/Backend/app/core/config.py` to introduce:

```py
auth_web_session_ttl_days: int = 3
```

Do not repurpose desktop refresh TTL for web sessions.

- [ ] **Step 2: Add a helper for web session expiration**

Modify `server/Backend/app/core/security.py` so there is an explicit function:

```py
def web_session_ttl() -> timedelta:
    return timedelta(days=get_settings().auth_web_session_ttl_days)
```

- [ ] **Step 3: Use the new TTL when issuing and setting web sessions**

Modify:
- `server/Backend/app/domains/auth/sessions.py`
- `server/Backend/app/api/v1/auth.py`

Rules:
- web sessions expire in `3 days`
- non-web tokens keep their current TTL behavior
- cookie `max_age` matches backend session expiry for web

- [ ] **Step 4: Add a failing frontend HTTP test for cookie + CSRF behavior**

Create `server/Frontend/src/core/http.test.ts` covering:
- unsafe requests send `credentials: "include"`
- CSRF header is attached when CSRF cookie exists
- auth requests no longer depend on `localStorage`

Example assertion:

```ts
expect(buildRequestInit("POST", { a: 1 }, "csrf-token")).toMatchObject({
  credentials: "include",
  headers: { "X-CSRF-Token": "csrf-token" },
});
```

- [ ] **Step 5: Run the failing HTTP test**

Run:

```bash
cd server/Frontend
npm run test -- src/core/http.test.ts
```

Expected:
- missing `http.ts` helpers and/or wrong request config

- [ ] **Step 6: Implement cookie and HTTP helpers**

Create `server/Frontend/src/core/cookies.ts`:

```ts
export function readCookie(name: string): string | null {
  return document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null;
}
```

Create `server/Frontend/src/core/http.ts` with:
- `credentials: "include"`
- JSON body handling
- CSRF header injection from `predict_mv_csrf`
- normalized error object for `401/403/404`

- [ ] **Step 7: Refactor API client off `localStorage` auth**

Modify `server/Frontend/src/core/api.ts`:
- delete `AUTH_TOKEN_KEY` flow
- remove bearer header persistence for web auth
- route login/register/confirm/logout/me through the cookie client

The API layer should call `/auth/me` as the source of truth for current web session.

- [ ] **Step 8: Implement app auth bootstrap**

Create `server/Frontend/src/app/auth-session.ts` with a small state machine:
- `booting`
- `authenticated`
- `anonymous`

Core method:

```ts
export async function bootstrapAuthSession() {
  try {
    const profile = await api.me();
    return { status: "authenticated", profile } as const;
  } catch (error) {
    if (isUnauthorized(error)) return { status: "anonymous" } as const;
    throw error;
  }
}
```

- [ ] **Step 9: Verify tests and backend syntax**

Run:

```bash
cd server/Frontend
npm run test -- src/core/http.test.ts src/core/routes.test.ts
cd ../Backend
python -m compileall app
```

Expected:
- frontend tests pass
- backend compile succeeds

- [ ] **Step 10: Commit**

```bash
git add server/Backend/app/core/config.py server/Backend/app/core/security.py server/Backend/app/domains/auth/sessions.py server/Backend/app/api/v1/auth.py server/Frontend/src/core/cookies.ts server/Frontend/src/core/http.ts server/Frontend/src/core/http.test.ts server/Frontend/src/app/auth-session.ts server/Frontend/src/core/api.ts
git commit -m "feat: switch web auth to cookie sessions"
```

---

### Task 3: Router Extraction and Persistent App Shell

**Files:**
- Create: `server/Frontend/src/app/route-constants.ts`
- Create: `server/Frontend/src/app/route-modals.ts`
- Create: `server/Frontend/src/app/router.tsx`
- Create: `server/Frontend/src/components/layout/AuthLayout.tsx`
- Create: `server/Frontend/src/components/layout/AppShell.tsx`
- Create: `server/Frontend/src/components/layout/Sidebar.tsx`
- Create: `server/Frontend/src/components/layout/Topbar.tsx`
- Modify: `server/Frontend/src/App.tsx`
- Modify: `server/Frontend/src/main.tsx`
- Modify: `server/Frontend/src/styles.css`
- Modify: `server/Frontend/src/app/router.test.tsx`

- [ ] **Step 1: Add failing router expectations for persistent shell**

Extend `server/Frontend/src/app/router.test.tsx` to verify:
- sidebar stays rendered on `/machines`, `/tasks`, `/results`, `/logs`, `/profile`
- topbar is shared across app routes
- auth routes do not render app shell

- [ ] **Step 2: Run the failing router test**

Run:

```bash
cd server/Frontend
npm run test -- src/app/router.test.tsx
```

Expected:
- no app router tree yet

- [ ] **Step 3: Create route constants and route-modal helpers**

`server/Frontend/src/app/route-constants.ts` should export canonical route builders, for example:

```ts
export const APP_ROUTES = {
  dashboard: "/dashboard",
  machines: "/machines",
  addMachine: "/machines/add",
  profile: "/profile",
  profileApiKeys: "/profile/api-keys",
};
```

`server/Frontend/src/app/route-modals.ts` should hold typed helpers for background-location modal flows.

- [ ] **Step 4: Extract layouts**

Create:
- `AuthLayout.tsx`
- `AppShell.tsx`
- `Sidebar.tsx`
- `Topbar.tsx`

Requirements:
- sidebar fixed and always visible
- topbar fixed and always visible
- main content scrolls inside the content region
- no breadcrumbs
- no notifications icon yet in foundation

- [ ] **Step 5: Create real router tree**

Create `server/Frontend/src/app/router.tsx` using `Routes` / `Route`:
- auth routes under `AuthLayout`
- app routes under `AppShell`
- unknown route redirect to `/machines`

`App.tsx` should become a thin root:

```tsx
export function App() {
  return <AppRouter />;
}
```

- [ ] **Step 6: Re-run router tests**

Run:

```bash
cd server/Frontend
npm run test -- src/app/router.test.tsx src/main.test.ts
```

Expected:
- both tests pass

- [ ] **Step 7: Commit**

```bash
git add server/Frontend/src/app/route-constants.ts server/Frontend/src/app/route-modals.ts server/Frontend/src/app/router.tsx server/Frontend/src/components/layout/AuthLayout.tsx server/Frontend/src/components/layout/AppShell.tsx server/Frontend/src/components/layout/Sidebar.tsx server/Frontend/src/components/layout/Topbar.tsx server/Frontend/src/App.tsx server/Frontend/src/main.tsx server/Frontend/src/styles.css server/Frontend/src/app/router.test.tsx
git commit -m "refactor: extract routed app shell"
```

---

### Task 4: Shared Foundation Primitives

**Files:**
- Create: `server/Frontend/src/components/primitives/Pagination.tsx`
- Create: `server/Frontend/src/components/primitives/CustomSelect.tsx`
- Create: `server/Frontend/src/components/primitives/ModalFrame.tsx`
- Create: `server/Frontend/src/components/primitives/StatusBadge.tsx`
- Create: `server/Frontend/src/components/primitives/EmptyState.tsx`
- Create: `server/Frontend/src/core/pagination.ts`
- Create: `server/Frontend/src/core/pagination.test.ts`
- Modify: `server/Frontend/src/styles.css`

- [ ] **Step 1: Add a failing pagination math test**

Create `server/Frontend/src/core/pagination.test.ts`:

```ts
it("clamps current page and calculates visible window", () => {
  expect(getPaginationState({ page: 9, pageSize: 20, totalItems: 35 })).toEqual(
    expect.objectContaining({ page: 2, totalPages: 2 }),
  );
});
```

- [ ] **Step 2: Run the failing pagination test**

Run:

```bash
cd server/Frontend
npm run test -- src/core/pagination.test.ts
```

Expected:
- helper missing

- [ ] **Step 3: Implement pure pagination helper**

Create `server/Frontend/src/core/pagination.ts` with:
- page clamping
- total page math
- offset/limit derivation
- visible page numbers

- [ ] **Step 4: Build primitive components**

Create:
- `Pagination.tsx`
- `CustomSelect.tsx`
- `ModalFrame.tsx`
- `StatusBadge.tsx`
- `EmptyState.tsx`

Rules:
- no native ugly selects shown directly
- all primitives inherit the current product style
- hover and press animations are mandatory

- [ ] **Step 5: Wire foundation animation tokens into global CSS**

Add organized sections to `server/Frontend/src/styles.css`:
- shell
- dropdown
- modal
- button motion
- table overflow safety
- focus-visible

- [ ] **Step 6: Re-run tests and build**

Run:

```bash
cd server/Frontend
npm run test -- src/core/pagination.test.ts src/core/ui.test.ts
npm run build
```

Expected:
- tests pass
- production build passes

- [ ] **Step 7: Commit**

```bash
git add server/Frontend/src/components/primitives/Pagination.tsx server/Frontend/src/components/primitives/CustomSelect.tsx server/Frontend/src/components/primitives/ModalFrame.tsx server/Frontend/src/components/primitives/StatusBadge.tsx server/Frontend/src/components/primitives/EmptyState.tsx server/Frontend/src/core/pagination.ts server/Frontend/src/core/pagination.test.ts server/Frontend/src/styles.css
git commit -m "feat: add frontend foundation primitives"
```

---

### Task 5: Global Search Foundation

**Files:**
- Create: `server/Frontend/src/core/search.ts`
- Create: `server/Frontend/src/core/search.test.ts`
- Create: `server/Frontend/src/components/search/GlobalSearch.tsx`
- Modify: `server/Frontend/src/components/layout/Topbar.tsx`
- Modify: `server/Frontend/src/core/api.ts`
- Modify: `server/Frontend/src/core/ui.ts`

- [ ] **Step 1: Add a failing search ranking test**

Create `server/Frontend/src/core/search.test.ts`:

```ts
it("ranks startsWith matches above contains matches", () => {
  const results = rankSearchResults("win", [
    { id: "1", label: "windows-prod", kind: "machine" },
    { id: "2", label: "prod-win", kind: "machine" },
  ]);
  expect(results.map((item) => item.id)).toEqual(["1", "2"]);
});
```

- [ ] **Step 2: Run the failing search test**

Run:

```bash
cd server/Frontend
npm run test -- src/core/search.test.ts
```

Expected:
- ranking helper missing

- [ ] **Step 3: Implement pure search indexing and ranking**

Create `server/Frontend/src/core/search.ts` with:
- source flattening
- normalization
- token-based match scoring
- result grouping by kind

The initial sources should be:
- machines
- tasks
- results
- groups
- app navigation items

- [ ] **Step 4: Build the global search dropdown**

Create `server/Frontend/src/components/search/GlobalSearch.tsx`.

Behavior:
- opens while typing
- keyboard navigation
- grouped sections
- route navigation on select
- no data mocking; it must consume real already-fetched app data

- [ ] **Step 5: Attach search to topbar**

Modify `Topbar.tsx` so every app page gets the same search entry point.

- [ ] **Step 6: Re-run search tests and build**

Run:

```bash
cd server/Frontend
npm run test -- src/core/search.test.ts src/core/ui.test.ts
npm run build
```

Expected:
- search tests pass
- build passes

- [ ] **Step 7: Commit**

```bash
git add server/Frontend/src/core/search.ts server/Frontend/src/core/search.test.ts server/Frontend/src/components/search/GlobalSearch.tsx server/Frontend/src/components/layout/Topbar.tsx server/Frontend/src/core/api.ts server/Frontend/src/core/ui.ts
git commit -m "feat: add global search foundation"
```

---

### Task 6: Migrate Existing Screens onto the New Foundation

**Files:**
- Modify: `server/Frontend/src/App.tsx`
- Modify: `server/Frontend/src/styles.css`
- Modify: `server/Frontend/src/core/api.ts`
- Modify: `server/Frontend/src/core/ui.ts`
- Modify: `server/Frontend/src/core/logs.ts`
- Modify: `server/Frontend/src/core/task-preview.ts`

- [ ] **Step 1: Add a failing smoke test for refresh-safe authenticated routing**

Extend `server/Frontend/src/app/router.test.tsx` with:

```tsx
it("keeps authenticated users inside app routes after bootstrap", async () => {
  mockBootstrapAuthSession({ status: "authenticated", profile: fakeProfile });
  renderWithRouter("/machines");
  expect(await screen.findByRole("navigation", { name: /sidebar/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd server/Frontend
npm run test -- src/app/router.test.tsx
```

Expected:
- bootstrap/session glue incomplete

- [ ] **Step 3: Shrink `App.tsx` into route-connected page composition**

Move routing and layout logic out of `App.tsx`. Keep only:
- page composition
- shared data loading
- route selection glue

`App.tsx` should no longer:
- parse URLs by hand
- own shell positioning
- own auth bootstrap rules

- [ ] **Step 4: Clean UTF-8 text and normalization helpers**

Modify:
- `server/Frontend/src/App.tsx`
- `server/Frontend/src/core/ui.ts`
- `server/Frontend/src/core/logs.ts`

Rules:
- replace mojibake text with valid Russian UTF-8
- keep date/time formatting in Moscow time
- keep machine title cleanup helpers

- [ ] **Step 5: Make current page screens use foundation primitives**

Without product redesign, update existing dashboard/machines/tasks/results/logs/access/reports/profile shells so they use:
- `AppShell`
- `Pagination`
- `CustomSelect`
- `StatusBadge`
- `EmptyState`

Do not attempt Batch 2 feature redesign here. This step only ports current screens onto the stable foundation.

- [ ] **Step 6: Run the full foundation verification set**

Run:

```bash
cd server/Frontend
npm run test -- src/main.test.ts src/app/router.test.tsx src/core/routes.test.ts src/core/http.test.ts src/core/search.test.ts src/core/pagination.test.ts src/core/task-preview.test.ts src/core/logs.test.ts src/core/ui.test.ts
npm run build
cd ../Backend
python -m compileall app
```

Expected:
- all listed tests pass
- frontend build passes
- backend compile passes

- [ ] **Step 7: Commit**

```bash
git add server/Frontend/src/App.tsx server/Frontend/src/styles.css server/Frontend/src/core/api.ts server/Frontend/src/core/ui.ts server/Frontend/src/core/logs.ts server/Frontend/src/core/task-preview.ts server/Frontend/src/app/router.test.tsx
git commit -m "refactor: migrate frontend screens onto foundation"
```

---

### Task 7: Local Smoke Verification and Handoff

**Files:**
- Modify only if verification exposes real defects

- [ ] **Step 1: Run local frontend smoke against the real backend**

Run the frontend locally against the real API base URL and manually verify:
- login
- refresh page on `/machines`
- direct open `/profile`
- global search opens and navigates
- unknown route redirects safely

- [ ] **Step 2: Run backend config smoke**

Use local or dockerized backend run to verify:
- `/api/v1/auth/login` for `client_kind="web"` sets cookies
- `/api/v1/auth/me` restores session
- logout clears cookies

- [ ] **Step 3: Review git diff for scope drift**

Run:

```bash
git diff --check
git status --short
```

Expected:
- no whitespace errors
- no unexpected generated files

- [ ] **Step 4: Final commit only if verification uncovered fixes**

```bash
git add <only changed tracked files>
git commit -m "fix: close frontend foundation verification issues"
```

---

## Execution Notes

- Do not implement Batch 2 or Batch 3 features while executing this plan.
- Do not keep bearer tokens in `localStorage` for web auth.
- Do not introduce mock data to “stabilize” routing or search.
- Keep Russian text valid `UTF-8`.
- Preserve the existing visual direction; improve structure and interaction, not brand identity.
- If a page needs a feature that belongs to Batch 2 or 3, wire only the route target and placeholder action state, not the unfinished feature itself.

## Expected Outcome

At the end of this plan we should have:
- a route-driven frontend with real URLs
- a stable app shell visible on all workspace pages
- refresh-safe web auth on server cookies
- foundation primitives for selects, pagination and modals
- a global search dropdown backed by live data
- cleaned text encoding and a slimmer `App.tsx`
- a safe base for implementing `Batch 2: Core Operations`
