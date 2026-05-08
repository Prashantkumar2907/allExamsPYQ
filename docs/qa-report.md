# QA Report

Date: 2026-05-08

## Automated checks

```bash
npm run build
npm run db:sqlite
npm audit --audit-level=moderate
```

Results:

- TypeScript and Vite production build passed.
- SQLite demo fixture generated at `local/demo.sqlite`.
- Audit returned zero vulnerabilities.
- Supabase CLI is installed, but Docker is not installed in this environment, so `npx supabase start` cannot run here.
- PWA manifest and service worker assets are reachable from the dev server.

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
