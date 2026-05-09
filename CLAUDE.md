# CLAUDE.md

## Project
allExamsPYQ is a React/Supabase previous-year-question practice platform for students and admins managing exam content, timed tests, reports, bookmarks, analytics, and leaderboards.
Stack: TypeScript 5.7.3 + React 19.2.4 + Vite 6.4.2 + Tailwind CSS 4.2.2 + Radix/Lucide/Recharts + Zustand + no test runner configured

## Commands
| Task | Command |
|---|---|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npx tsc -b` |
| Preview | `npm run preview` |
| SQLite fixture | `npm run db:sqlite` |
| Audit | `npm audit --audit-level=moderate` |
| Supabase local | `npx supabase start` |
| Supabase reset | `npx supabase db reset` |
| Lint | Not configured |
| Format | Not configured |
| Test (unit/e2e/watch) | Not configured |

## Structure
`src/main.tsx` - React entrypoint and service worker registration.
`src/App.tsx` - all route definitions, lazy page imports, guest/auth/role guards.
`src/components/layout/` - authenticated app shell, sidebar, header, error boundary.
`src/components/ui/` - reusable Tailwind/Radix primitives and toast store.
`src/components/shared/` - loading, empty, error, stats, and PWA install states.
`src/components/charts/` - Recharts dashboard chart components.
`src/pages/auth/` - login and registration screens.
`src/pages/student/` - dashboard, exam browser, tests, results, analytics, bookmarks, profile.
`src/pages/admin/` - exam, question, test, upload, report, user analytics, profile tools.
`src/stores/` - Zustand auth, page-title, and theme stores.
`src/lib/` - Supabase/demo client switch, API helpers, constants, demo data, utilities.
`src/types/database.ts` and `supabase/` - hand-written DB types plus Postgres schema/RLS/seed.

## Code Rules
- Treat `src/App.tsx` as the route map; add lazy imports and guarded routes there.
- Browser data access goes through `src/lib/supabase.ts`; it switches to `src/lib/demoSupabase.ts` when demo mode is active.
- Pages currently own Supabase queries; do not invent a service layer unless the task is explicitly a refactor.
- Check every Supabase `{ error }`; use `ErrorState` for page-load failures and `toast.*` for action failures.
- When adding DB fields/tables/RPCs, update migrations, `src/types/database.ts`, demo seed/adapter, and affected UI together.
- Keep Supabase RLS as the real authorization boundary; React role guards are UX only.
- Do not persist Supabase sessions in Zustand; `authStore` is in-memory and Supabase owns session storage.
- New users must remain `student` from `handle_new_user()`; never trust client metadata for role assignment.
- Keep profile reads private; student-visible profile fragments must go through sanitized RPCs such as `get_leaderboard`.
- Use `src/components/ui/*` primitives, `Button` loading states, Lucide icons, and `aria-label` on icon-only controls.
- Use CSS variables and Tailwind utilities from `src/index.css`; do not add a separate styling system.
- Route/page views should intentionally handle loading, empty, error, and success states.
- Use `ConfirmDialog` for destructive confirmation and `toast` for feedback; do not use native alerts/confirms.
- Keep UI compact and dashboard-like; avoid decorative blurred backgrounds and oversized marketing layouts inside tools.
- Prefer existing relative imports; the `@/*` alias exists but most source uses relative paths.
- No automated tests are configured; verify risky changes with `npm run build`, `npm run db:sqlite`, and relevant browser/demo checks.
- Never commit real `.env`, Supabase keys, tokens, generated `local/*.sqlite`, `dist/`, `node_modules/`, or `*.tsbuildinfo`.

### File Placement
- Components: reusable primitives in `src/components/ui/`, cross-page states in `src/components/shared/`, shell in `src/components/layout/`.
- Routes/pages: `src/pages/auth/`, `src/pages/student/`, or `src/pages/admin/`, then wire in `src/App.tsx`.
- API/data helpers: `src/lib/api.ts` for result/error/text helpers, `src/lib/supabase.ts` for client entry, `src/lib/demoSupabase.ts` for demo parity.
- Types: database-facing interfaces and enums in `src/types/database.ts`; local page-only shapes stay near the page.
- Naming: PascalCase `.tsx` components/pages, camelCase `.ts` helpers/stores, timestamped SQL migrations under `supabase/migrations/`.

## Skills
| Skill | When to load |
|---|---|
| architecture | Adding routes/files or deciding where code belongs |
| api-conventions | Adding Supabase queries, RPCs, migrations, demo data, or data errors |
| ui-conventions | Building/editing UI, layout, forms, loading/error/empty states |
| state-management | Working with Zustand, page state, local state, or client cache choices |
| auth | Touching login, signup, sessions, profiles, guards, roles, or RLS-sensitive reads |
| new-feature | Starting any feature that crosses schema, demo data, route, UI, or state |
| deployment | Building, Supabase local/hosted setup, PWA assets, or env/debug release work |
| commit-messages | Writing commits, PR summaries, or choosing scopes from this repo |
| performance | Lazy loading, chunking, pagination, caching, indexes, or bundle-size concerns |
| domain-exam-practice | Changing exam hierarchy, questions, attempts, scoring, reports, bookmarks, or leaderboard rules |
