# QA Report

Date: 2026-05-08

## Automated checks

```bash
npm run build
npm run db:sqlite
npm audit --audit-level=moderate
```

Results:

- TypeScript and Vite production build passed after allowing Vite/esbuild to spawn outside the sandbox.
- SQLite demo fixture generated at `local/demo.sqlite`.
- Audit returned zero vulnerabilities.
- Supabase CLI is installed, but Docker is not installed in this environment, so `npx supabase start` cannot run here.
- PWA manifest and service worker assets are reachable from the dev server.
- New shared error/loading primitives compile in production chunks.
- Demo-mode `record_leaderboard_attempt` RPC shim compiles with the real Supabase client surface.

## 2026-05-08 modernization checks

- Verified `npm run build`.
- Verified `npm run db:sqlite`.
- Verified `npm audit --audit-level=moderate`.
- Did not run local Supabase migrations because Docker is unavailable in this environment.
- Did not run Playwright/Cypress because this repo does not currently include an E2E test runner.

## 2026-05-08 quality follow-up checks

- Verified `npm run build` after auth guard, confirmation dialog, profile, and practice-start changes.
- Verified `npm run db:sqlite` regenerated `local/demo.sqlite`.
- Verified `npm audit --audit-level=moderate` returned zero vulnerabilities.
- Smoke checked the running Vite dev server at `http://127.0.0.1:3000` and received HTTP 200.
- Re-scanned source for native `window.alert`, `window.confirm`, `alert(...)`, `console.error`, and remaining `any` usage in app code. Only no-match scans passed after cleanup.

## Browser walkthrough

Test URL: `http://127.0.0.1:3001`

Student account:

- Logged in with `demoaccount@allexamspyq.local`.
- Verified dashboard stats, recent tests, charts, and quick actions render from demo data.
- Opened the tests page and started `JEE Demo Mechanics Sprint`.
- Answered all three questions.
- Submitted the test.
- Verified result route shows `12/12`, `100%` accuracy, explanations, report actions, and bookmark actions.
- Verified the completed attempt updates dashboard totals.

Admin account:

- Logged in with `admin@allexamspyq.local`.
- Verified admin dashboard stats, recent submissions, difficulty distribution, and pending report count.
- Opened test management.
- Opened the question assignment dialog.
- Verified assigned questions and topic-filtered available questions.
- Opened reported questions.
- Added admin notes and resolved a pending report.
- Verified the report moved from pending to resolved.
- Reloaded admin questions after pagination changes.
- Verified question rows render as paginated records with responsive action buttons.
- Verified browser console has no application errors after adding PWA and pagination code.

## Notes

- Browser console had no application errors during the tested workflows.
- The only warning was the intentional demo-mode Supabase env warning.
- Direct local Supabase was not tested because Docker is unavailable on this machine.
- Native install prompts depend on browser installability checks. The iOS guidance path is rendered by device detection, while Chromium install action appears after `beforeinstallprompt`.

## 2026-05-09 privacy, UI, and architecture checks

- Verified `npm run build`.
- Verified `npm run db:sqlite`; regenerated `local/demo.sqlite`.
- Verified `npm audit --audit-level=moderate` returned zero vulnerabilities.
- Verified `git diff --check`.
- Re-scanned source for native `window.alert`, `window.confirm`, `alert(...)`, `console.error`, `any`, non-ASCII visible UI text, `rounded-2xl`, blurred orb backgrounds, and direct student leaderboard profile joins. The scans returned no matches.
- Smoke checked the running Vite app at `http://127.0.0.1:3001`.
- Browser login as `demoaccount@allexamspyq.local` passed and landed on `/dashboard`.
- Browser leaderboard route loaded through the sanitized `get_leaderboard` RPC with no error state and no console errors.
- Browser bookmarks route loaded saved question content with no error state and no console errors.
- In-app screenshot capture timed out during the final visual capture attempt; DOM snapshots and browser console checks passed.
- Did not run Supabase locally because Docker remains unavailable in this environment.
