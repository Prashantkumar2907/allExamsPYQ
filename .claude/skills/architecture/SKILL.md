---
name: architecture
description: Use when adding routes, files, or modules in the allExamsPYQ Vite React SPA and you need to follow its actual directory ownership.
---

# Architecture

## When to use this skill
Use this before adding pages, routes, components, stores, utilities, scripts, migrations, or docs. Also use it before moving code between `src/pages`, `src/components`, `src/lib`, `src/stores`, and `supabase`.

## Quick reference

| Area | Existing owner |
|---|---|
| App boot | `src/main.tsx`, `src/registerServiceWorker.ts` |
| Routes and guards | `src/App.tsx` |
| Authenticated shell | `src/components/layout/AppLayout.tsx`, `Header.tsx`, `Sidebar.tsx` |
| UI atoms/primitives | `src/components/ui/*` |
| Shared view states | `src/components/shared/*` |
| Student workflows | `src/pages/student/*` |
| Admin workflows | `src/pages/admin/*` |
| Auth screens | `src/pages/auth/*` |
| Client state | `src/stores/*` |
| Supabase/data helpers | `src/lib/*` |
| DB schema/types | `supabase/migrations/*`, `src/types/database.ts` |

## Route placement
All app routes are declared in `src/App.tsx` using lazy imports and nested guards.

- Public guest routes live under `GuestGuard`: `/`, `/login`, `/register`.
- Authenticated routes live under `AuthGuard` and render through `AppLayout`.
- Student routes live under `RoleGuard role="student"` and use `src/pages/student/*`.
- Admin routes live under `RoleGuard role="admin"` and use `src/pages/admin/*`.
- Add a page by creating the page file, adding a lazy import, then adding the guarded `<Route>`.

## File placement rules

- Reusable commands, cards, dialogs, form controls, tabs, sheets, toasts, avatars, and pagination go in `src/components/ui/`.
- Page-level but reusable loading/empty/error/stat/PWA states go in `src/components/shared/`.
- Layout shell changes go in `src/components/layout/`.
- Charts shared by dashboards go in `src/components/charts/DashboardCharts.tsx`.
- Page-specific interfaces can stay inside the page file, as seen in admin and student pages.
- Database-facing interfaces and enums go in `src/types/database.ts`.
- Cross-page helpers go in `src/lib/api.ts`, `src/lib/utils.ts`, `src/lib/constants.ts`, or a new focused file under `src/lib/`.
- Supabase schema changes go in a timestamped SQL file under `supabase/migrations/`.
- Demo data changes go in `src/lib/demoData.ts`; demo query behavior goes in `src/lib/demoSupabase.ts`.

## Naming rules

- React components and pages use PascalCase filenames: `TestTakingPage.tsx`, `ConfirmDialog.tsx`.
- Zustand stores use camelCase filenames ending in `Store.ts`: `authStore.ts`, `themeStore.ts`.
- Utility modules use camelCase names: `demoSupabase.ts`, `avatarConfig.ts`.
- SQL migrations use timestamp prefixes like `202605090001_privacy_and_index_hardening.sql`.
- Prefer the existing relative import style inside source files. The `@/*` alias exists, but the app mostly imports relatively.

## Do not

- Do not add Next.js `app/`, API routes, server actions, or backend route handlers; this project is a Vite SPA.
- Do not put feature pages under `src/components`.
- Do not create a parallel design-system folder when `src/components/ui` and `src/index.css` already own primitives and tokens.
- Do not add database fields without updating `src/types/database.ts` and demo mode when UI reads them.
