---
name: deployment
description: Use when building, configuring, or debugging allExamsPYQ Vite output, Supabase local/hosted setup, demo mode, PWA assets, or environment variables.
---

# Deployment

## When to use this skill
Use this for build/release work, Supabase local or hosted setup, Vite preview, environment configuration, PWA/service-worker behavior, or deployment troubleshooting.

## Quick reference

| Task | Command or file |
|---|---|
| Production build | `npm run build` |
| Preview built app | `npm run preview` |
| Local dev server | `npm run dev` |
| SQLite fixture | `npm run db:sqlite` |
| Local Supabase start | `npx supabase start` |
| Local Supabase reset | `npx supabase db reset` |
| Hosted Supabase push | `npx supabase db push` |
| Build artifact | `dist/` |
| Env example | `.env.example` |
| Supabase config | `supabase/config.toml` |
| PWA files | `public/manifest.webmanifest`, `public/sw.js`, `public/pwa-icon.svg` |

## Environments

- Demo mode is automatic when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.
- `VITE_DEMO_MODE=true` also forces demo mode.
- Real local Supabase uses `VITE_SUPABASE_URL=http://127.0.0.1:54321` and the anon key printed by `npx supabase start`.
- Hosted Supabase is configured by setting hosted URL/anon key in `.env.local` or the deployment platform.
- Docker is required for `npx supabase start`; the QA docs note Docker was unavailable in this environment.

## Build details

- `npm run build` runs `tsc -b && vite build`.
- `vite.config.ts` aliases `@` to `src`.
- Vite manual chunks split `charts`, `supabase`, `radix-ui`, `icons`, and `react`.
- Vite module preload filters chart dependencies whose path includes `charts-`.
- Service worker registration only happens in production via `src/registerServiceWorker.ts`.

## CI/CD status

- No `.github/workflows`, CircleCI, Jenkinsfile, Dockerfile, or deployment platform config is present.
- No branch-to-environment map or rollback procedure is documented.
- Do not invent CI gates; document commands actually run.

## Do not

- Do not commit `.env`, `.env.local`, `.env.*.local`, `dist/`, `local/`, `*.sqlite`, or `*.tsbuildinfo`.
- Do not expose Supabase service-role keys to Vite client code.
- Do not assume local Supabase can run without Docker.
- Do not remove PWA files without also updating `index.html` and `registerServiceWorker.ts`.
