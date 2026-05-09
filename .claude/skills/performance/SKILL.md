---
name: performance
description: Use when optimizing allExamsPYQ bundle loading, lazy routes, chart chunks, pagination, Supabase query volume, indexes, or PWA caching.
---

# Performance

## When to use this skill
Use this for load-time work, Vite chunk changes, Recharts/lazy imports, query pagination, count queries, indexes, service-worker caching, or suspected slow dashboard/admin pages.

## Quick reference

- `src/App.tsx` lazy-loads all route pages.
- `src/pages/student/DashboardPage.tsx` and `src/pages/admin/DashboardPage.tsx` lazy-load chart components.
- `vite.config.ts` creates manual chunks for `charts`, `supabase`, `radix-ui`, `icons`, and `react`.
- `vite.config.ts` filters chart preload dependencies with `modulePreload.resolveDependencies`.
- Pagination exists in `src/components/ui/Pagination.tsx`.
- PWA shell caching lives in `public/sw.js`.
- Query-supporting indexes live in `supabase/migrations/*`.

## Bundle rules

- Keep Recharts isolated from the initial route bundle where possible.
- Do not import dashboard charts eagerly into route files that can lazy-load them.
- Preserve manual chunk names unless a build inspection proves a better split.
- Use `npm run build` to verify TypeScript and Vite output.

## Query rules

- Use `.select('id', { count: 'exact', head: true })` for counts.
- Use `.range(from, to)` for large lists.
- Keep admin and student dashboard reads parallel when independent.
- Add explicit indexes in migrations when introducing new high-cardinality filters, joins, orderings, or delete checks.
- Match indexes to real query patterns; existing examples include `test_attempts(status, completed_at)`, `questions(topic_id, is_active)`, `bookmarks(user_id, created_at)`, and `leaderboard_scores(exam_id, total_score)`.

## PWA/cache rules

- `public/sw.js` caches same-origin GET requests and falls back navigations to `/index.html`.
- `src/registerServiceWorker.ts` registers the worker only in production.
- If changing manifest icon/start URLs, update `index.html` references too.

## Do not

- Do not remove route lazy loading for convenience.
- Do not load all rows for admin lists that can paginate.
- Do not add broad profile joins to leaderboard pages; use the sanitized RPC.
- Do not add cache behavior for non-GET requests in the service worker.
