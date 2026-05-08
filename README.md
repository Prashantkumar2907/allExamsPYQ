# allExamsPYQ

allExamsPYQ is a previous-year-question practice platform for exam preparation. It gives students a focused way to browse syllabus content, start topic/chapter/subject practice, take timed tests, review explanations, bookmark questions, report issues, and track progress. Admins get the tools to manage exams, syllabus hierarchy, questions, tests, bulk uploads, reports, and users.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Zustand for client state
- Supabase for hosted auth/database/storage-ready architecture
- Seeded browser demo backend when Supabase env vars are not present
- SQLite fixture generator for local data validation

## Quick start

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, the app automatically runs in demo mode with seeded data.

Demo accounts:

```text
Student: demoaccount@allexamspyq.local / Demo@12345
Admin:   admin@allexamspyq.local       / Admin@12345
```

## Local data fixture

```bash
npm run db:sqlite
```

This creates `local/demo.sqlite` with the same core demo content used by the browser demo mode.

## Supabase local setup

Supabase CLI is configured under `supabase/`.

```bash
npx supabase start
npx supabase db reset
```

Copy the local API URL and anon key printed by `supabase start` into `.env.local`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
VITE_DEMO_MODE=false
```

Docker is required for `supabase start`.

## Hosted Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Then set hosted values in `.env.local` or your deployment platform.

## Project map

```text
src/
  components/
    layout/      App shell, header, sidebar
    shared/      Empty states, stats cards, spinners
    ui/          Reusable UI atoms and primitives
  lib/
    demoData.ts       Seeded demo state
    demoSupabase.ts   Supabase-like browser demo adapter
    env.ts            Environment and demo-mode detection
    supabase.ts       Supabase client entrypoint
    utils.ts          Shared UI/data helpers
  pages/
    auth/        Login and registration
    student/     Student workflows
    admin/       Admin workflows
  stores/        Auth, page title, and theme stores
  types/         Database-facing TypeScript types
supabase/
  migrations/    Postgres schema, RLS, indexes, triggers
  seed.sql       Demo seed data
scripts/
  create-demo-sqlite.mjs
docs/
  next-supabase-skills.md
  product-improvement-backlog.md
  qa-report.md
```

## Verification

```bash
npm run build
npm run db:sqlite
npm audit --audit-level=moderate
```

See `docs/qa-report.md` for the latest browser walkthrough.
