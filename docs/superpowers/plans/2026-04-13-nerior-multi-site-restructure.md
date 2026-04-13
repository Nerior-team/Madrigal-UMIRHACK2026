# Nerior Multi-Site Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current single-site deployment into a public Nerior company site plus separate product and service subdomains without introducing mock content.

**Architecture:** Keep one backend and one frontend codebase, but make the frontend host-aware so each subdomain renders its own shell and route tree. Extend backend auth/session configuration so `crossplat.nerior.store` and `api.nerior.store` can share accounts while keeping separate cookie names and independent web sessions. Add public-content backend primitives only where required for real forms and future article ingestion, but do not seed fake publications.

**Tech Stack:** React, React Router, Vite, FastAPI, SQLAlchemy, PostgreSQL, nginx, SMTP

---

## File Map

**Frontend host routing and shells**
- Modify: `server/Frontend/src/app/platform-host.ts`
- Modify: `server/Frontend/src/app/root-router.tsx`
- Create: `server/Frontend/src/app/host-app.tsx`
- Create: `server/Frontend/src/app/public-router.tsx`
- Create: `server/Frontend/src/app/api-router.tsx`
- Modify: `server/Frontend/src/main.tsx`
- Test: `server/Frontend/src/app/root-router.test.tsx`
- Test: `server/Frontend/src/app/platform-host.test.ts`

**Crossplat product relocation**
- Modify: `server/Frontend/src/App.tsx`
- Modify: `server/Frontend/src/components/layout/AppShell.tsx`
- Modify: `server/Frontend/src/components/layout/Topbar.tsx`
- Modify: `server/Frontend/src/core/routes.ts`
- Modify: `server/Frontend/src/core/api.ts`
- Modify: `server/Frontend/src/core/http.ts`
- Modify: `server/Frontend/src/styles.css`
- Test: existing route/app tests around auth and workspace flows

**Public Nerior site**
- Create: `server/Frontend/src/public/NeriorSiteApp.tsx`
- Create: `server/Frontend/src/public/site-data.ts`
- Create: `server/Frontend/src/public/routes.ts`
- Create: `server/Frontend/src/public/components/*`
- Create: `server/Frontend/src/public/pages/*`
- Create: `server/Frontend/src/public/public.css`
- Test: `server/Frontend/src/public/*.test.tsx`

**Docs / Community / Help public sites**
- Create: `server/Frontend/src/docs/DocsApp.tsx`
- Create: `server/Frontend/src/community/CommunityApp.tsx`
- Create: `server/Frontend/src/help/HelpApp.tsx`
- Create: route/page/component files under each folder
- Test: route rendering tests for each public app

**API cabinet**
- Modify: `server/Frontend/src/platform/*` or move to `server/Frontend/src/api-portal/*`
- Create/Modify: dedicated API auth session helpers with separate branding and product availability cards
- Test: auth route tests and API key workspace tests

**Backend auth/session split**
- Modify: `server/Backend/app/core/config.py`
- Modify: `server/Backend/app/api/v1/auth.py`
- Modify: `server/Backend/app/api/deps.py`
- Create: `server/Backend/app/domains/auth/web_apps.py`
- Test: `server/Backend/app/...` auth cookie behavior tests if test harness exists, otherwise add focused unit tests around app resolution helpers

**Backend public contact flow**
- Create: `server/Backend/app/api/v1/public.py`
- Create: `server/Backend/app/domains/public_contact/*`
- Create: `server/Backend/app/infra/email/templates/contact_form.html`
- Create: `server/Backend/app/infra/email/templates/contact_form.txt`
- Modify: `server/Backend/app/main.py`
- Test: backend validation and email rendering tests

**Backend publications foundation**
- Create: `server/Backend/app/domains/publications/models.py`
- Create: `server/Backend/app/domains/publications/schemas.py`
- Create: `server/Backend/app/domains/publications/repository.py`
- Create: `server/Backend/app/api/v1/publications.py`
- Modify: `server/Backend/app/db/metadata.py`
- Test: repository/serialization tests

**Deployment**
- Modify: `server/.env.example`
- Modify: `server/nginx/nginx.conf`
- Modify: `server/nginx/nginx.bootstrap.conf`
- Create: server host configs for `nerior`, `crossplat`, `docs`, `community`, `help`, `api`, `smart-planner`, `karpik`

---

### Task 1: Host Resolution Foundation

**Files:**
- Modify: `server/Frontend/src/app/platform-host.ts`
- Modify: `server/Frontend/src/app/root-router.tsx`
- Create: `server/Frontend/src/app/host-app.tsx`
- Test: `server/Frontend/src/app/root-router.test.tsx`
- Test: `server/Frontend/src/app/platform-host.test.ts`

- [ ] Expand host classification from `main/platform` to explicit app kinds: `nerior-site`, `crossplat`, `docs`, `community`, `help`, `api-cabinet`, `smart-planner-holding`, `karpik-holding`.
- [ ] Keep local-dev aliases for each host family so the same code can be previewed without production DNS.
- [ ] Make `RootRouter` dispatch to the correct router/app by host kind instead of assuming everything non-platform is the product.
- [ ] Add tests proving `nerior.store`, `crossplat.nerior.store`, `docs.nerior.store`, `api.nerior.store`, `community.nerior.store`, `help.nerior.store`, `smart-planner.nerior.store`, and `karpik.nerior.store` resolve correctly.

### Task 2: Crossplat Product Relocation

**Files:**
- Modify: `server/Frontend/src/App.tsx`
- Modify: `server/Frontend/src/components/layout/Topbar.tsx`
- Modify: `server/Frontend/src/styles.css`
- Modify: `server/Frontend/src/core/http.ts`
- Test: relevant current app tests

- [ ] Replace user-facing `Predict` / `Predict MV` naming with `Crossplat` where it appears in UI titles, install instructions, and meta labels.
- [ ] Change machine pairing/install helper URLs so they point to `https://crossplat.nerior.store`.
- [ ] Ensure the product app renders only on `crossplat.*` hosts and not on `nerior.store`.
- [ ] Keep current product UX and flows unchanged apart from branding/domain updates.

### Task 3: Public Nerior Corporate Site

**Files:**
- Create: `server/Frontend/src/public/NeriorSiteApp.tsx`
- Create: `server/Frontend/src/public/routes.ts`
- Create: `server/Frontend/src/public/site-data.ts`
- Create: `server/Frontend/src/public/components/*`
- Create: `server/Frontend/src/public/pages/*`
- Create: `server/Frontend/src/public/public.css`

- [ ] Build the public top navigation exactly around the reference structure: `Обновления`, `Продукты`, `Бизнес`, `Компания`, `Разработчикам`.
- [ ] Implement hover-expansion menus matching the reference categories:
  - `Продукты` -> `Crossplat`, `Smart planner`, `Karpik`
  - `Компания` -> public company sections
  - `Разработчикам` -> `API`, `Документация`, `Сообщество`
- [ ] Add the public CTA pair on the right: contact and trial/free-product CTA.
- [ ] Implement the `Обновления` page with both list and grid layouts, category filters, and empty-real-data behavior.
- [ ] Keep publications backed by real backend endpoints, but render an empty state until articles are inserted later.

### Task 4: Articles and Updates Backend Foundation

**Files:**
- Create: `server/Backend/app/domains/publications/*`
- Create: `server/Backend/app/api/v1/publications.py`
- Modify: `server/Backend/app/db/metadata.py`
- Modify: `server/Backend/app/main.py`

- [ ] Add publication entities that can support title, slug, category, summary, cover image, publish date, and rich-body blocks for text/image/video.
- [ ] Expose public read-only endpoints for publication listing, filters, and article detail.
- [ ] Do not insert mock records.
- [ ] Return clean empty responses that allow the frontend to render zero-state layouts without fake content.

### Task 5: Contact Form and Email Delivery

**Files:**
- Create: `server/Backend/app/domains/public_contact/*`
- Create: `server/Backend/app/api/v1/public.py`
- Create: `server/Backend/app/infra/email/templates/contact_form.html`
- Create: `server/Backend/app/infra/email/templates/contact_form.txt`
- Modify: `server/Backend/app/main.py`
- Create/Modify: `server/Frontend/src/public/pages/Contact*.tsx`

- [ ] Implement a real public contact endpoint with validation for interest area, company size, phone, email, and message fields.
- [ ] Support the interest dropdown values `crossplat`, `smart-planner`, `karpik`, `other`.
- [ ] Enforce digit-only validation where required by spec.
- [ ] Send formatted HTML + text email to `i@karpovstepan.ru` through the existing SMTP transport.
- [ ] Render friendly success and validation-error states in the public form UI.

### Task 6: Docs, Community, and Help Public Sites

**Files:**
- Create: `server/Frontend/src/docs/*`
- Create: `server/Frontend/src/community/*`
- Create: `server/Frontend/src/help/*`

- [ ] Build `docs.nerior.store` as a public docs site with its own sidebar/navigation and placeholder copy blocks for every documentation section.
- [ ] Build `community.nerior.store` as a public presentation-ready community site in the same visual language.
- [ ] Build `help.nerior.store` as a public help center with category navigation and placeholder support content.
- [ ] Keep all three unauthenticated.

### Task 7: API Cabinet Reframe

**Files:**
- Modify or move: existing `server/Frontend/src/platform/*`
- Add tests around API auth and product availability rendering

- [ ] Reframe the current platform portal into `api.nerior.store`.
- [ ] Keep auth required only for `api.nerior.store`.
- [ ] Preserve separate cookies/session names from `crossplat`.
- [ ] Show product availability cards:
  - `Crossplat` active/selectable
  - `Smart-Planner` disabled
  - `Karpik` disabled
- [ ] Keep API key management real and connected to existing backend contracts.

### Task 8: Separate Web Session Cookies

**Files:**
- Modify: `server/Backend/app/core/config.py`
- Modify: `server/Backend/app/api/v1/auth.py`
- Create: `server/Backend/app/domains/auth/web_apps.py`
- Modify: frontend auth bootstrap helpers as needed

- [ ] Add request-aware web-app resolution so the backend can issue different cookie names for `crossplat` and `api`.
- [ ] Keep accounts shared, but sessions isolated by cookie name and CSRF cookie name.
- [ ] Ensure `docs/community/help/nerior` never rely on protected auth bootstrap.
- [ ] Update frontend bootstrap code to read the correct CSRF cookie per host app.

### Task 9: Holding Pages for Unavailable Products

**Files:**
- Create: lightweight public holding page component(s)

- [ ] Build `smart-planner.nerior.store` and `karpik.nerior.store` as public, presentation-safe holding pages.
- [ ] Show gray disabled styling and the text `Не доступно в данный момент`.
- [ ] Do not expose broken links or fake product functionality.

### Task 10: nginx and Deployment Split

**Files:**
- Modify: `server/nginx/nginx.conf`
- Modify: `server/nginx/nginx.bootstrap.conf`
- Modify: `server/.env.example`

- [ ] Add host routing for all public and protected subdomains on the same server IP.
- [ ] Proxy each host to the single frontend container while preserving the `Host` header for frontend host-based rendering.
- [ ] Keep `/api` proxied to backend for every host that needs it.
- [ ] Configure auth-safe cookie behavior for `crossplat` and `api`.
- [ ] Verify TLS coverage for every new subdomain before claiming completion.

### Task 11: Verification

**Files:**
- Test: frontend and backend targeted tests

- [ ] Run focused frontend tests for host routing, public pages, API auth pages, and existing Crossplat product regressions.
- [ ] Run frontend build.
- [ ] Run backend verification for new public/API/auth modules.
- [ ] Perform server-side smoke checks for:
  - `https://nerior.store`
  - `https://crossplat.nerior.store`
  - `https://docs.nerior.store`
  - `https://community.nerior.store`
  - `https://help.nerior.store`
  - `https://api.nerior.store`
  - `https://smart-planner.nerior.store`
  - `https://karpik.nerior.store`

