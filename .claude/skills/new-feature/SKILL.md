---
name: new-feature
description: Use when adding an allExamsPYQ feature that may touch routes, Supabase schema, demo mode, UI, state, or verification.
---

# New Feature

## When to use this skill
Use this when starting a feature from scratch or extending a student/admin workflow beyond a small one-file edit.

## Quick reference

Most meaningful features in this repo span several layers:

- route/page: `src/App.tsx` plus `src/pages/*`
- data: direct Supabase queries in the page
- schema/types: `supabase/migrations/*` and `src/types/database.ts`
- demo parity: `src/lib/demoData.ts` and `src/lib/demoSupabase.ts`
- UI states: `LoadingSpinner`, `EmptyState`, `ErrorState`, `toast`, `ConfirmDialog`
- verification: `npm run build`, `npm run db:sqlite`, and focused browser/demo checks

## End-to-end checklist

1. Identify the role and route guard: guest, student, or admin in `src/App.tsx`.
2. If the feature needs new persisted data, add a timestamped migration in `supabase/migrations/`.
3. Update `src/types/database.ts` for database-facing shapes and enums.
4. Add or update demo seed data in `src/lib/demoData.ts`.
5. Add or update demo query/RPC behavior in `src/lib/demoSupabase.ts`.
6. Build the page under `src/pages/student`, `src/pages/admin`, or `src/pages/auth`.
7. Reuse primitives from `src/components/ui` and shared states from `src/components/shared`.
8. Keep page-specific form/filter/dialog state local unless multiple pages need it.
9. Check all Supabase errors and surface them with `ErrorState` or `toast`.
10. Update navigation in `src/components/layout/Sidebar.tsx` only when the feature needs a top-level nav item.
11. Update docs only when behavior or workflows changed, preferring concise project-specific notes.
12. Verify with build and the relevant demo path.

## Feature examples from this repo

- Student test start creates `test_attempts`, inserts placeholder `user_answers`, then navigates to `/test/:attemptId`.
- Practice start in `ExamBrowserPage.tsx` uses `source_type` of `subject`, `chapter`, or `topic`.
- Test submission in `TestTakingPage.tsx` updates attempt scoring, upserts `syllabus_progress` for practice, and calls `record_leaderboard_attempt` for formal tests.
- Admin question creation writes `questions` and `options`; editing replaces options after updating the question.

## Do not

- Do not add a route without the correct guard.
- Do not create persisted data that is absent from migrations, types, and demo mode.
- Do not leave an action with only console logging for errors.
- Do not assume tests exist; this repo currently verifies with build, fixtures, audit, and manual/browser checks.
