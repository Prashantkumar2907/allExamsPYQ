# Supabase Local Setup

This folder contains the runnable database contract for allExamsPYQ.

## Start locally

```bash
npx supabase start
cp .env.example .env.local
npm run dev
```

Use the local API URL and anon key printed by `supabase start` in `.env.local`.
Docker is required for `npx supabase start`.

## Reset database with demo data

```bash
npx supabase db reset
```

The reset command applies `supabase/migrations/*` and then runs `supabase/seed.sql`.

## Demo accounts

Student:

```text
demoaccount@allexamspyq.local
Demo@12345
```

Admin:

```text
admin@allexamspyq.local
Admin@12345
```

## Deploy to hosted Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```
