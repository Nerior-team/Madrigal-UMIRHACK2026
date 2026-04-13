# Platform Developer Portal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch the first real foundation for `platform.nerior.store` with shared web auth, a separate premium black-and-white frontend shell, real API key management, and real developer documentation powered by the current backend contracts.

**Architecture:** Keep one backend and one API surface. Extend backend cookie/origin configuration so the existing web session can work across `nerior.store` and `platform.nerior.store`, then split the frontend by hostname so the platform portal gets its own layout, navigation, styles, and data flows without disturbing the main product UI.

**Tech Stack:** FastAPI, Pydantic Settings, React, React Router, Vite, Vitest, existing `apiFetch`/`accountApi` client layer, existing `/api/v1/profile/api-keys` and `/api/v1/external/*` contracts.

---

## File Structure

**Backend**
- Modify: `server/Backend/app/core/config.py`
  Add cookie-domain configuration and any platform-origin helpers needed for shared auth.
- Modify: `server/Backend/app/api/v1/auth.py`
  Apply cookie domain consistently for set/delete cookie flows.
- Modify: `server/.env.example`
  Document `BACKEND_COOKIE_DOMAIN` and `platform.nerior.store` origin support.

**Frontend bootstrap and routing**
- Modify: `server/Frontend/src/main.tsx`
  Switch from a single hard-coded router to a hostname-aware root router.
- Modify: `server/Frontend/src/main.test.ts`
  Update bootstrap expectations for the new root router entry.
- Create: `server/Frontend/src/app/root-router.tsx`
  Decide whether to render the main product app or the platform portal app based on hostname.
- Create: `server/Frontend/src/app/platform-host.ts`
  Small host-detection helpers to centralize `platform.nerior.store` logic.
- Create: `server/Frontend/src/app/platform-router.tsx`
  React Router tree for the developer portal.
- Create: `server/Frontend/src/app/platform-router.test.tsx`
  Route/layout coverage for the platform host routes.

**Frontend developer portal shell**
- Create: `server/Frontend/src/platform/PlatformApp.tsx`
  Portal bootstrap, shared state loading, notices, and section composition.
- Create: `server/Frontend/src/platform/components/PlatformShell.tsx`
  Distinct shell, header, navigation, and page frame.
- Create: `server/Frontend/src/platform/components/PlatformHero.tsx`
  Premium overview hero with quickstart/status framing.
- Create: `server/Frontend/src/platform/components/PlatformStatCard.tsx`
  Reusable monochrome analytics card pattern.
- Create: `server/Frontend/src/platform/components/PlatformSectionCard.tsx`
  Shared content container for docs/keys/analytics sections.
- Create: `server/Frontend/src/platform/platform.css`
  Dedicated black/white design system and interactions for the portal.

**Frontend developer data**
- Create: `server/Frontend/src/platform/api/platform.ts`
  Real portal data client built on current backend contracts.
- Create: `server/Frontend/src/platform/api/platform.test.ts`
  Mapping and request-shape coverage for developer portal data helpers.
- Create: `server/Frontend/src/platform/docs/reference.ts`
  Real endpoint reference data sourced from current `/external` routes.
- Create: `server/Frontend/src/platform/docs/examples.ts`
  Real `curl`, `Python`, and `JavaScript` examples for the supported endpoints.

**Frontend pages**
- Create: `server/Frontend/src/platform/pages/PlatformOverviewPage.tsx`
  Overview, quickstart, capability summary, and current API health/status surface.
- Create: `server/Frontend/src/platform/pages/PlatformApiKeysPage.tsx`
  Dedicated API key management experience using real profile API key endpoints.
- Create: `server/Frontend/src/platform/pages/PlatformDocsPage.tsx`
  Reference docs, request examples, auth guidance, scopes, and error guidance.
- Create: `server/Frontend/src/platform/pages/PlatformAnalyticsPage.tsx`
  API key usage, last-used metadata, and lightweight analytics powered by real key data.

**Cross-cutting frontend integration**
- Modify: `server/Frontend/src/core/account.ts`
  Reuse or export any types/helpers needed by the portal without duplicating API-key mapping logic.
- Modify: `server/Frontend/src/core/http.ts`
  Only if hostname-aware API-base behavior is required; otherwise leave untouched.

## Task 1: Lock The Auth And Hostname Foundation

**Files:**
- Modify: `server/Backend/app/core/config.py`
- Modify: `server/Backend/app/api/v1/auth.py`
- Modify: `server/.env.example`

- [ ] Add `backend_cookie_domain: str | None = None` to settings and normalize blank values to `None`.
- [ ] Add a small helper/property for allowed origins if a clearer parsed list is needed for both `nerior.store` and `platform.nerior.store`.
- [ ] Update `_set_web_cookie`, `_set_csrf_cookie`, and `_clear_web_cookie` to pass `domain=settings.backend_cookie_domain` consistently.
- [ ] Update `server/.env.example` with `BACKEND_COOKIE_DOMAIN=` and a multi-origin `BACKEND_ALLOWED_ORIGINS` example that includes `http://localhost:3000`, `https://nerior.store`, and `https://platform.nerior.store`.
- [ ] Run a lightweight backend verification command after edits.
- [ ] Commit with `git commit -m "feat: support shared auth cookies for platform portal"` once verified.

## Task 2: Add A Host-Aware Frontend Entry

**Files:**
- Modify: `server/Frontend/src/main.tsx`
- Modify: `server/Frontend/src/main.test.ts`
- Create: `server/Frontend/src/app/root-router.tsx`
- Create: `server/Frontend/src/app/platform-host.ts`
- Create: `server/Frontend/src/app/platform-router.tsx`
- Create: `server/Frontend/src/app/platform-router.test.tsx`

- [ ] Add `isPlatformHost(hostname)` and `resolveHostApp(hostname)` helpers in `platform-host.ts`.
- [ ] Replace the single `AppRouter` mount in `main.tsx` with a `RootRouter` that picks the main app or platform app by hostname.
- [ ] Keep the existing product routing untouched for non-platform hosts.
- [ ] Create a first platform route tree with at least `/`, `/keys`, `/docs`, and `/analytics`.
- [ ] Add tests proving the platform host renders the platform router and non-platform hosts keep rendering the existing router.
- [ ] Commit with `git commit -m "feat: add hostname-aware app bootstrap"` once verified.

## Task 3: Build The Platform Data Layer On Real Contracts

**Files:**
- Create: `server/Frontend/src/platform/api/platform.ts`
- Create: `server/Frontend/src/platform/api/platform.test.ts`
- Modify: `server/Frontend/src/core/account.ts`
- Create: `server/Frontend/src/platform/docs/reference.ts`
- Create: `server/Frontend/src/platform/docs/examples.ts`

- [ ] Reuse current `accountApi.listApiKeys`, `createApiKey`, `revokeApiKey`, and `listMachineScopeOptions` flows instead of reimplementing profile API key access.
- [ ] Add a portal-specific client that combines:
  - current authenticated profile/API-key endpoints
  - current `/api/v1/external/machines`
  - current `/api/v1/external/machines/{machine_id}/commands`
  - current `/api/v1/external/tasks/{task_id}`
  - current `/api/v1/external/results/{result_id}` reference metadata where useful
- [ ] Build endpoint reference definitions directly from the routes already present in `server/Backend/app/api/v1/external.py`.
- [ ] Add code-example builders for bearer auth, list machines, list commands, create task, fetch task logs, and export result JSON.
- [ ] Add tests for response mapping and any generated doc/example helpers.
- [ ] Commit with `git commit -m "feat: add real developer portal data layer"` once verified.

## Task 4: Build The Premium Platform Shell And Overview

**Files:**
- Create: `server/Frontend/src/platform/PlatformApp.tsx`
- Create: `server/Frontend/src/platform/components/PlatformShell.tsx`
- Create: `server/Frontend/src/platform/components/PlatformHero.tsx`
- Create: `server/Frontend/src/platform/components/PlatformStatCard.tsx`
- Create: `server/Frontend/src/platform/components/PlatformSectionCard.tsx`
- Create: `server/Frontend/src/platform/pages/PlatformOverviewPage.tsx`
- Create: `server/Frontend/src/platform/platform.css`

- [ ] Establish the portal design direction: luxury minimal black/white, editorial spacing, thin borders, restrained motion, no inheritance from the current product stylesheet except where explicitly intended.
- [ ] Add a shell with portal nav, compact account/status area, and a dedicated content frame for docs-oriented pages.
- [ ] Build the overview page with:
  - platform positioning copy
  - auth guidance
  - quickstart checklist
  - key usage summary
  - endpoint coverage summary
  - real API health/status surface based on reachable backend data
- [ ] Keep all data real; if something does not exist in backend yet, omit it instead of mocking it.
- [ ] Add focused rendering tests if the portal page structure becomes complex enough to warrant them.
- [ ] Commit with `git commit -m "feat: add platform overview shell"` once verified.

## Task 5: Move API Keys Into The Developer Portal

**Files:**
- Create: `server/Frontend/src/platform/pages/PlatformApiKeysPage.tsx`
- Reuse: `server/Frontend/src/platform/components/PlatformSectionCard.tsx`
- Reuse or adapt: `server/Frontend/src/core/account.ts`
- Optionally modify: `server/Frontend/src/components/profile/ApiKeysWorkspace.tsx` only if a shared helper extraction is genuinely cleaner than duplication

- [ ] Build a dedicated API keys page with:
  - clean creation flow
  - scopes/machine selection
  - expiry selection
  - raw-key reveal block
  - active/revoked state presentation
  - usage and last-used metadata
- [ ] Keep the portal layout visually independent from the existing profile page.
- [ ] If shared formatting logic is needed, extract only the small helper, not the current profile UI.
- [ ] Add tests for any extracted helper or page behavior that is not already covered.
- [ ] Commit with `git commit -m "feat: add platform api keys workspace"` once verified.

## Task 6: Ship The First Docs And Analytics Pages

**Files:**
- Create: `server/Frontend/src/platform/pages/PlatformDocsPage.tsx`
- Create: `server/Frontend/src/platform/pages/PlatformAnalyticsPage.tsx`
- Reuse: `server/Frontend/src/platform/docs/reference.ts`
- Reuse: `server/Frontend/src/platform/docs/examples.ts`

- [ ] Build a docs page with:
  - bearer auth instructions
  - scope model
  - endpoint cards
  - request/response examples
  - error behavior notes
  - quick links between sections
- [ ] Build an analytics page with:
  - total keys
  - active keys
  - run-enabled keys
  - total uses
  - last used timeline/list
  - per-key usage ranking from real `uses_count`
- [ ] Keep labels polished and minimal; no placeholder copy.
- [ ] Add tests for docs/example rendering only if logic branches or generated output deserves it.
- [ ] Commit with `git commit -m "feat: add platform docs and analytics pages"` once verified.

## Task 7: Verify The Foundation End-To-End

**Files:**
- Verify only; no file ownership

- [ ] Run frontend unit tests: `npm run test` in `server/Frontend`
- [ ] Run frontend build: `npm run build` in `server/Frontend`
- [ ] Run backend syntax sanity check: `python -m compileall app` in `server/Backend`
- [ ] Review changed files for accidental UTF-8 regressions.
- [ ] Summarize final local readiness, remaining gaps, and server-side steps still needed before production rollout.
- [ ] Commit with `git commit -m "chore: verify platform portal foundation"` only if a verification-related code/docs tweak was required.

## Notes

- Shared session on `platform.nerior.store` depends on setting `BACKEND_COOKIE_DOMAIN=.nerior.store` in the production environment.
- Production rollout will also need host nginx configuration for `platform.nerior.store`; that is deployment work, not part of this foundation implementation.
- Do not introduce a separate platform backend or mocked datasets.
