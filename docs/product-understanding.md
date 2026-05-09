# allExamsPYQ Product Understanding

Date: 2026-05-09

## Core Value Proposition

allExamsPYQ is a previous-year-question practice platform for competitive exam preparation. Students can browse an exam syllabus by exam, subject, chapter, and topic; start focused practice or formal timed tests; review option-level explanations; bookmark and report questions; and track progress through dashboards, analytics, and leaderboards. Admins manage the content pipeline, including syllabus hierarchy, questions, tests, bulk uploads, reports, and user analytics.

## Critical File Path

- App boot: `src/main.tsx`
- Router and guards: `src/App.tsx`
- Auth/session store: `src/stores/authStore.ts`
- Supabase client switch: `src/lib/supabase.ts`
- Demo-mode adapter: `src/lib/demoSupabase.ts`
- Shared types: `src/types/database.ts`
- Global design tokens and animations: `src/index.css`
- Layout shell: `src/components/layout/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`
- UI primitives: `src/components/ui/*`
- Shared loading/empty/stat components: `src/components/shared/*`
- Student workflows: `src/pages/student/*`
- Admin workflows: `src/pages/admin/*`
- Supabase schema, RLS, constraints, and indexes: `supabase/migrations/202605080001_initial_schema.sql`
- Privacy/index follow-up migration: `supabase/migrations/202605090001_privacy_and_index_hardening.sql`
- Supabase seed and local docs: `supabase/seed.sql`, `supabase/README.md`
- Local fixture generator: `scripts/create-demo-sqlite.mjs`

## Target Architecture

### Frontend

The frontend is a Vite, React 19, TypeScript single-page app with React Router route guards. Authenticated routes render through `AppLayout`, which provides the fixed sidebar, header, scroll containment, toast container, PWA install prompt, and an error boundary. State is intentionally small: Zustand stores own auth/session, page title metadata, and theme.

The UI layer uses Tailwind CSS v4 tokens from `src/index.css`, Radix UI primitives for dialogs/selects/tabs/toasts, Lucide icons, compact reusable atoms in `src/components/ui`, and small shared display components in `src/components/shared`.

### Backend And Data

There is no custom API server. Browser code talks directly to Supabase Auth and Postgres through `@supabase/supabase-js`. Authorization is intended to live in Supabase Row Level Security policies. When Supabase env vars are not configured, `src/lib/supabase.ts` swaps the real client for the seeded browser-only `demoSupabase` adapter so the same UI can run locally without Docker or hosted Supabase.

### Database

The database is Postgres through Supabase. The initial migration defines 15 public tables for exams, syllabus hierarchy, questions/options, profiles, tests, attempts, answers, bookmarks, leaderboard scores, reports, and syllabus progress. It includes enums, foreign keys, uniqueness constraints, check constraints, RLS policies, admin helper function `public.is_admin()`, update triggers, and baseline indexes for common reads.

## Identified Gaps

### Security Risks

- Mitigated in this pass: `handle_new_user()` now ignores client-provided role metadata and creates new users as `student`.
- Admin pages rely on UI route guards, while the real enforcement is RLS. This is the right general model, but high-risk write flows should consistently surface Supabase errors so failed RLS writes do not look successful.
- Several mutation flows ignore `error` from insert/update/upsert calls, including test creation, question creation, answer saving, reporting, bookmarking, and leaderboard updates.
- Mitigated in this pass: `authStore.updateProfile` now sends an allowlisted profile patch.
- Report submission only stores a reason even though the schema supports `description`; this limits abuse triage context.

### Missing DB Indexes / Performance Bottlenecks

- `test_attempts` is frequently queried globally by `status`, `completed_at`, and recent admin dashboards; current indexes are mostly user-scoped, so admin recent-activity and seven-day analytics can still scan too much data.
- `reported_questions` admin list orders by `created_at`; only pending status is indexed, leaving full report review order under-indexed.
- `user_answers` is joined by `question_id` in results and analytics paths but only has an attempt index.
- Bulk upload repeatedly finds hierarchy rows by `(exam_id, name)`, `(subject_id, name)`, and `(chapter_id, name)`. Unique constraints support this, but explicit naming/index documentation should stay aligned with these upsert-like flows.
- Leaderboard updates are read-modify-write from the browser. Concurrent submissions can overwrite increments; a Postgres RPC would be safer for atomic leaderboard aggregation.

### UI/UX Dead Ends

- Loading and empty states exist, but page-level error states are inconsistent. Several failed loads only log to the console and leave stale or empty UI.
- Mitigated in this pass: remaining native `window.alert` / `window.confirm` flows were moved to app toasts and `ConfirmDialog`.
- Mitigated in this pass: shared close/dismiss/account controls, avatar swatches, correct-option controls, and admin row actions now expose accessible labels.
- Test-taking has no explicit empty/error state if an attempt has zero questions or a query fails.
- Mitigated in this pass: student practice launch now has per-action loading feedback and toast-based failures.

### Code Smells

- Pages contain most business logic directly: Supabase queries, validation, domain calculations, and UI rendering are tightly coupled.
- Several large files (`TestManagementPage.tsx`, `QuestionManagementPage.tsx`, `ProfilePage.tsx`, `TestTakingPage.tsx`) would benefit from feature-level hooks or service helpers.
- Types are mostly hand-written table interfaces instead of generated Supabase types, so query shape drift is easy.
- `any` is used in high-value data flows such as admin dashboard data shaping and test payloads.
- Demo adapter mirrors many Supabase patterns manually; future query additions should be documented so demo mode does not silently diverge.

## Scoped Modernization Plan

This pass should prioritize a small set of improvements with high leverage:

- Add missing database hardening and indexes through the existing initial migration.
- Remove the admin-role signup footgun from `handle_new_user()`.
- Add shared API result/error utilities and use them on selected high-risk writes.
- Add reusable page error and loading state primitives.
- Improve the most critical student and admin flows: test list/start, test taking, test result reporting/bookmarks, and admin question/test management.
- Document app-specific auth, DB, and UI patterns under `docs/.llm-skills/`.

## Implemented In This Pass

- Removed client-controlled role assignment from `handle_new_user()`.
- Added text/numeric checks and additional indexes to the initial migration.
- Added `record_leaderboard_attempt()` for atomic leaderboard increments.
- Added demo-mode support for the leaderboard RPC.
- Added `src/lib/api.ts` for shared error/result helpers.
- Added `src/components/shared/ErrorState.tsx`.
- Improved auth guard behavior while profiles are still loading.
- Added stronger validation, loading feedback, and toast/error handling to key test, question, result, dashboard, and CSV upload flows.
- Added repo-specific future-agent memory in `docs/.llm-skills/`.
- Made auth profile-load failures explicit through `profileError` so guards show a recoverable `ErrorState` instead of an endless spinner.
- Made Supabase auth listener registration idempotent for React StrictMode.
- Replaced native destructive confirmations in exam, question, and test management with the shared `ConfirmDialog`.
- Replaced the student practice-start native alert with toasts, per-item loading states, and keyboard-accessible subject/chapter cards.
- Removed remaining `any` usage from high-value admin dashboard/import/test-management flows.
- Added accessibility labels to menu, sheet, toast, avatar, option-selection, and syllabus action controls.

## 2026-05-09 Deep Audit Addendum

### Ten-Pass Discovery Map

1. Repository and git topology: app root is `allExamsPYQ`, with its own Git repo and `origin` remote.
2. Runtime stack: Vite, React 19, TypeScript, Tailwind CSS v4, Zustand, Radix, Lucide, Supabase.
3. Entrypoints: `src/main.tsx` renders `src/App.tsx`; `vite.config.ts` defines aliases and production chunks.
4. Routing: `src/App.tsx` owns guest, authenticated, student, and admin route guards.
5. Auth: `src/stores/authStore.ts` initializes from Supabase auth, loads `profiles`, and gates role redirects.
6. Data access: pages call the exported `supabase` client directly; demo mode is mirrored in `src/lib/demoSupabase.ts`.
7. Database: migrations define Postgres tables, RLS, helper functions, triggers, constraints, and indexes.
8. UI primitives: shared controls live in `src/components/ui`; loading, empty, and error states live in `src/components/shared`.
9. Student workflows: dashboards, exam browser, tests, results, bookmarks, analytics, leaderboard, and profile live in `src/pages/student`.
10. Admin workflows: content hierarchy, question bank, test management, reports, bulk upload, users, and profile live in `src/pages/admin`.

### Additional Findings

- Student leaderboard previously required broad `profiles` reads to join display names and avatars. That exposed profile rows more widely than needed.
- The auth store persisted Supabase session-shaped data in its own `auth-storage` key, duplicating token-bearing session data outside Supabase's client storage.
- Shared input/select/textarea primitives needed stronger label and error semantics for consistent accessibility.
- The route transition wrapper animated only on first mount because it was not keyed by location.
- Several visible strings used non-ASCII glyphs or mojibake-prone characters in compact UI labels.
- Some remaining FK-backed paths lacked explicit indexes for delete checks, report review, user-answer option references, and test-question reverse lookups.

### Implemented On 2026-05-09

- Added `get_leaderboard()` as a security-definer RPC that returns only leaderboard-safe profile fields.
- Restricted `profiles` select policy to the current user or admins; leaderboard no longer depends on direct profile joins.
- Added indexes for profile exam lookups, test attempts by test, reverse test-question lookups, report review joins, syllabus topic checks, and selected answer option references.
- Removed Zustand `persist` from auth state and clear the legacy `auth-storage` key during initialization.
- Mirrored `get_leaderboard()` in the demo Supabase adapter.
- Added leaderboard page error handling with retry.
- Improved Button, Input, Textarea, Select, Card, Avatar, EmptyState, Pagination, and PWA prompt primitives.
- Keyed route content by pathname so route transitions replay correctly.
- Added bookmark page error state, mutation feedback, keyboard access for bookmark rows, and safer delete/note handling.
- Added optional report details to question reports so admins receive better triage context.
- Cleaned visible non-ASCII UI text and removed decorative blurred orb backgrounds from auth/landing/profile surfaces.
