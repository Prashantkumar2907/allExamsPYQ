---
name: domain-exam-practice
description: Use when changing allExamsPYQ exam hierarchy, questions, tests, attempts, scoring, reports, bookmarks, syllabus progress, or leaderboard behavior.
---

# Domain: Exam Practice

## When to use this skill
Use this before changing tables or workflows involving exams, subjects, chapters, topics, questions, options, tests, attempts, user answers, bookmarks, reports, syllabus progress, or leaderboard scores.

## Quick reference

Core hierarchy:

```text
exams -> subjects -> chapters -> topics -> questions -> options
tests -> test_questions -> questions
profiles -> test_attempts -> user_answers
profiles -> bookmarks / reported_questions / syllabus_progress / leaderboard_scores
```

Source files:

- Schema: `supabase/migrations/202605080001_initial_schema.sql`
- Privacy/index update: `supabase/migrations/202605090001_privacy_and_index_hardening.sql`
- Types: `src/types/database.ts`
- Student test start: `src/pages/student/TestListPage.tsx`
- Practice start: `src/pages/student/ExamBrowserPage.tsx`
- Test taking/submission: `src/pages/student/TestTakingPage.tsx`
- Results/bookmark/report: `src/pages/student/TestResultPage.tsx`
- Admin content: `src/pages/admin/ExamManagementPage.tsx`, `QuestionManagementPage.tsx`, `TestManagementPage.tsx`, `BulkUploadPage.tsx`

## Business rules

- Exams contain subjects; subjects contain chapters; chapters contain topics; topics contain questions.
- Questions currently behave as single-choice in UI validation, even though `question_type` enum also includes `multiple_choice` and `numerical`.
- Admin question forms require at least two options and exactly one correct option.
- Formal tests are `tests` with assigned `test_questions`; practice attempts use `source_type` of `subject`, `chapter`, or `topic`.
- Active tests are visible to students; draft/archived tests are admin-managed.
- Scheduled tests can have `scheduled_at` and `scheduled_end_at`; the end must be after the start.
- `allow_multiple_attempts=false` blocks another completed formal attempt by the same student.
- `shuffle_questions` randomizes formal test question order when creating an attempt.
- Attempt creation also creates placeholder `user_answers` rows.
- Submission computes correct, wrong, skipped, non-negative score, completion timestamp, and time taken.
- Practice submissions upsert `syllabus_progress` for attempted topics.
- Formal test submissions call `record_leaderboard_attempt` for atomic leaderboard totals.
- Leaderboard display calls `get_leaderboard` to expose only rank-safe profile fields.
- Bookmarks are unique per `user_id, question_id`.
- Reports start as `pending`; admins can update status, notes, and resolution timestamp.

## Invariants

- Keep non-negative score/count fields non-negative in UI and DB.
- Keep `source_name` and required text fields trimmed and non-empty.
- Preserve attempt history: `questions` are `on delete restrict` from attempts/test questions where needed.
- Keep demo data consistent with the schema and visible workflows.
- Preserve RLS ownership: users own attempts, answers, bookmarks, reports, and syllabus progress; admins manage content.

## Do not

- Do not enable multiple-correct or numerical behavior without updating UI, scoring, validation, types, seed/demo data, and tests/verification notes.
- Do not create a test attempt without placeholder `user_answers`.
- Do not update leaderboard totals from React with read-modify-write.
- Do not broaden `profiles` reads for leaderboards or public displays.
- Do not delete questions in a way that breaks historical attempts.
