---
name: api-conventions
description: Use when changing allExamsPYQ Supabase queries, RPCs, migrations, demo-mode parity, or data error handling.
---

# API Conventions

## When to use this skill
Use this for any change involving `supabase.from(...)`, `supabase.rpc(...)`, `supabase.auth.*`, migrations, seed data, `src/types/database.ts`, `src/lib/demoData.ts`, or `src/lib/demoSupabase.ts`.

## Quick reference

- There is no custom API server and no dedicated service layer.
- Browser code imports `supabase` from `src/lib/supabase.ts`.
- `src/lib/supabase.ts` selects the real Supabase client or `demoSupabase` based on `src/lib/env.ts`.
- Shared data helpers live in `src/lib/api.ts`: `getErrorMessage`, `ok`, `fail`, `assertData`, `normalizeText`.
- Page-load failures should render `ErrorState`; action failures should call `toast.error(...)`.
- Auth headers/session handling are owned by `@supabase/supabase-js`; do not hand-roll headers.

## Adding or changing a query

1. Import `supabase` from `../../lib/supabase` or the correct relative path.
2. Use the existing page-owned query style unless the task is explicitly a service-layer refactor.
3. Destructure and check `{ data, error, count }`.
4. Convert errors with `getErrorMessage(error, fallback)`.
5. Use `ErrorState` for blocking page data and `toast.*` for inline mutations.
6. If the query must work in demo mode, verify `src/lib/demoSupabase.ts` supports the chain, filters, relation attachment, and return shape.

## Schema and type changes

When adding a table, field, enum, or relation, update all applicable surfaces:

- `supabase/migrations/<timestamp>_<name>.sql`
- `src/types/database.ts`
- `src/lib/demoData.ts`
- `src/lib/demoSupabase.ts` relation attachment/defaults/filter behavior
- affected pages under `src/pages/student` or `src/pages/admin`
- `scripts/create-demo-sqlite.mjs` if the SQLite fixture should include it

## RPC pattern

RPCs are used when browser-side logic would be unsafe or too broad:

- `record_leaderboard_attempt` in `supabase/migrations/202605080001_initial_schema.sql` performs atomic leaderboard increments.
- `get_leaderboard` in `supabase/migrations/202605090001_privacy_and_index_hardening.sql` returns sanitized leaderboard profile fields.
- Every new `.rpc(...)` call needs a matching branch in `demoSupabase.rpc(...)`, or demo mode will fail at runtime.
- Revoke from `public` and grant to `authenticated` when the function is meant for signed-in users.

## Pagination and counts

- Use Supabase `.range(from, to)` with `{ count: 'exact' }` where pages need totals.
- Existing examples: `QuestionManagementPage.tsx` uses `QUESTIONS_PAGE_SIZE = 10`; `TestListPage.tsx` paginates completed history; `BookmarksPage.tsx` uses `PAGE_SIZE = 30`.
- For count-only metrics, use `.select('id', { count: 'exact', head: true })`.

## Do not

- Do not import `createClient` directly in pages; use `src/lib/supabase.ts`.
- Do not read `.env` directly from app code; use `src/lib/env.ts`.
- Do not ignore Supabase `error` on writes.
- Do not reintroduce browser-side leaderboard read-modify-write.
- Do not join `profiles` directly for student-visible public ranking data; use `get_leaderboard`.
