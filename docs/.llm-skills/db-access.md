# Database Access Pattern

Use this before changing Supabase queries, migrations, demo data, or fixtures.

## Critical Files

- `src/lib/supabase.ts`: Exports the app-wide `supabase` object.
- `src/lib/demoSupabase.ts`: Implements the subset of Supabase used in demo mode.
- `src/lib/demoData.ts`: Seeded browser demo data.
- `src/types/database.ts`: Hand-written database-facing TypeScript interfaces.
- `supabase/migrations/202605080001_initial_schema.sql`: Source of truth for schema, RLS, functions, constraints, and indexes.
- `scripts/create-demo-sqlite.mjs`: Local SQLite fixture generator.

## Query Rules

- Always check `{ error }` from Supabase reads and writes.
- Use `toast.error(...)` for action failures and `ErrorState` for page-load failures.
- Keep browser writes scoped to RLS-safe operations. If a write needs atomic increments or privileged logic, add a Postgres function instead of doing read-modify-write in React.
- Mirror enum validation in import/admin flows with typed guards such as `value is QuestionType` instead of casting incoming CSV or form values to `any`.
- Keep indexes aligned with real query patterns. Common filters include:
  - `test_attempts.user_id + status + completed_at`
  - global `test_attempts.status + completed_at`
  - `questions.topic_id + is_active`
  - `test_questions.test_id + sort_order`
  - `leaderboard_scores.exam_id + total_score`
  - `reported_questions.status + created_at`
  - `bookmarks.user_id + created_at`
- If adding a Supabase `.rpc(...)` call, add a matching method to `src/lib/demoSupabase.ts` or demo mode will fail at runtime.
- If adding tables or fields, update all three surfaces: migration, `src/types/database.ts`, and demo data/adapter if the UI touches it.

## Atomic Leaderboard Updates

Formal test submission should call:

```ts
await supabase.rpc('record_leaderboard_attempt', {
  p_exam_id: profile.exam_id,
  p_user_id: profile.id,
  p_score: finalScore,
  p_correct: correct,
  p_questions: latestQuestions.length,
});
```

Do not reintroduce browser-side leaderboard read-modify-write; concurrent submissions can lose increments.

## Migration Rules

- Keep `public.is_admin()` as a `security definer` helper to avoid recursive RLS checks on `profiles`.
- New text fields that are required should usually include `check (length(btrim(field)) > 0)`.
- New numeric score/count fields should include non-negative checks.
- Use `on delete cascade` for dependent content and `on delete restrict` for question references that should preserve attempt history.
