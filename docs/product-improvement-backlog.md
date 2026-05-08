# allExamsPYQ Product Improvement Backlog

## Why build this

allExamsPYQ exists to make previous-year-question practice faster, more measurable, and easier to maintain. Students need a clean way to browse a syllabus, practice at the right granularity, take timed tests, review explanations, and understand progress. Admins need a reliable content pipeline for exams, syllabus hierarchy, questions, tests, reports, and imports.

## Improvements completed in this pass

1. Added a seeded browser demo backend.
   - `src/lib/demoData.ts`
   - `src/lib/demoSupabase.ts`
   - Demo mode activates automatically when Supabase env vars are absent.
   - The same login, query, insert, update, delete, upsert, filtering, ordering, and simple join patterns used by the app now work without Docker.

2. Added a visible demo login path.
   - Login screen includes student/admin demo account shortcuts.
   - Header shows a compact demo badge when the app is not connected to Supabase.

3. Added a runnable Supabase schema and seed path.
   - `supabase/migrations/202605080001_initial_schema.sql`
   - `supabase/seed.sql`
   - `supabase/config.toml`
   - `supabase/README.md`

4. Added demo accounts for local Supabase.
   - Student: `demoaccount@allexamspyq.local` / `Demo@12345`
   - Admin: `admin@allexamspyq.local` / `Admin@12345`

5. Added a SQLite fixture generator for fast local data validation.
   - Command: `npm run db:sqlite`
   - Output: `local/demo.sqlite`

6. Fixed the formal-test content gap.
   - Admins can now assign questions to tests from `src/pages/admin/TestManagementPage.tsx`.
   - Students no longer depend on externally-populated `test_questions`.

7. Improved practice coverage.
   - Students can now start practice from subject, chapter, or topic level in `ExamBrowserPage`.

8. Improved test submission correctness.
   - Auto-submit now uses latest answer state.
   - Resumed attempts calculate elapsed time from original `started_at`.
   - Practice attempts mark attempted topics as completed in `syllabus_progress`.

9. Improved formal-test behavior.
   - Test scheduling windows are shown and enforced in the student test list.
   - `shuffle_questions` now controls attempt question order.

10. Applied the MedX-style UI foundation.
   - Outfit and Space Mono fonts.
   - Brand teal `#34B6B3`.
   - Border-led cards, rounded-full buttons, compact font scale, stronger focus rings.

11. Removed dependency audit findings.
   - `npm audit` now reports zero vulnerabilities.

12. Added responsive pagination and scroll containment.
   - Reusable `src/components/ui/Pagination.tsx`.
   - Admin question bank now uses counted pages instead of a hard 50-row scroll area.
   - Student test history uses the same pagination control.
   - Global overscroll behavior suppresses bounce/glow at scroll boundaries.

13. Added PWA install support.
   - `public/manifest.webmanifest`
   - `public/sw.js`
   - `public/pwa-icon.svg`
   - `src/components/shared/PWAInstallPrompt.tsx`
   - iOS users see Add to Home Screen guidance; install-capable browsers get an Install action.

14. Added modernization audit and repo memory docs.
   - `docs/product-understanding.md`
   - `docs/.llm-skills/auth-pattern.md`
   - `docs/.llm-skills/db-access.md`
   - `docs/.llm-skills/ui-components.md`

15. Hardened auth, database, and test submission flows.
   - New users are created as students regardless of client metadata.
   - Profile updates are allowlisted in `authStore`.
   - Added database checks and indexes for high-volume admin/student queries.
   - Added `record_leaderboard_attempt` RPC plus demo-mode support for atomic leaderboard increments.

16. Improved UI state completeness and action feedback.
   - Added shared `ErrorState`.
   - Added accessible loading status to `LoadingSpinner`.
   - Added page-load error states to dashboards and test flows.
   - Added validation, loading, and toast feedback to critical test/question/upload mutations.

## Next highest-impact improvements

1. Replace direct Supabase calls in pages with typed service functions.
   - This will centralize error handling, make RLS assumptions explicit, and make local adapters easier.

2. Add Playwright end-to-end tests.
   - Auth smoke test.
   - Admin creates exam hierarchy and question.
   - Admin assigns questions to a test.
   - Student completes a test and reviews result.

3. Add real multiple-choice and numerical question support.
   - Current UI exposes the enum but behaves like single-choice.

4. Expand content QA and import validation.
   - CSV preview before import.
   - Duplicate detection.
   - Batch progress indicator for large files.
   - Rich row-level recovery and downloadable error report.

5. Add question media support with Supabase Storage.
   - Images, diagrams, and solution attachments.

6. Improve analytics depth.
   - Subject/topic-level accuracy from `user_answers` joined to syllabus hierarchy.
   - Difficulty breakdown from actual question difficulty instead of aggregate approximation.

7. Add database tests for RLS.
   - Verify student/admin permissions against every table.
   - Verify demo seed stays usable after migrations.

8. Add larger seeded pagination fixtures.
   - Current demo seed is intentionally small; add 25+ sample questions when automated pagination screenshots are introduced.
