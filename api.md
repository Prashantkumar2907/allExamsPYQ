# allExamsPYQ — API Documentation

> Comprehensive role-wise Supabase API catalog with table schemas, RLS policies, and query details.

---

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Auth APIs](#auth-apis)
3. [Shared APIs](#shared-apis)
4. [Student APIs](#student-apis)
5. [Admin APIs](#admin-apis)
6. [Table Summary](#table-summary)
7. [RLS Policies](#rls-policies)
8. [SQL Commands](#sql-commands)

---

## Database Schema Overview

| # | Table | Description | Key Columns |
|---|-------|-------------|-------------|
| 1 | `exams` | Available competitive exams | `name`, `description`, `is_active` |
| 2 | `subjects` | Subjects within an exam | `exam_id`, `name`, `sort_order` |
| 3 | `chapters` | Chapters within a subject | `subject_id`, `name`, `sort_order` |
| 4 | `topics` | Topics within a chapter | `chapter_id`, `name`, `sort_order` |
| 5 | `questions` | Practice/test questions | `topic_id`, `question_text`, `question_type`, `difficulty`, `marks`, `negative_marks`, `year` |
| 6 | `options` | Answer options for questions | `question_id`, `option_text`, `is_correct`, `explanation` |
| 7 | `profiles` | User profiles (linked to `auth.users`) | `full_name`, `email`, `role`, `exam_id`, `avatar_url`, `phone`, `bio` |
| 8 | `tests` | Admin-created tests | `title`, `exam_id`, `is_global`, `duration_minutes`, `total_marks`, `status`, `scheduled_at` |
| 9 | `test_questions` | Junction: test ↔ question | `test_id`, `question_id`, `sort_order` |
| 10 | `test_attempts` | Student test attempts | `user_id`, `test_id`, `source_type`, `score`, `status`, `time_taken_seconds` |
| 11 | `user_answers` | Individual answers per attempt | `attempt_id`, `question_id`, `selected_option_id`, `is_correct` |
| 12 | `bookmarks` | Student bookmarked questions | `user_id`, `question_id`, `notes` |
| 13 | `leaderboard_scores` | Aggregated leaderboard per exam | `exam_id`, `user_id`, `total_score`, `tests_taken` |
| 14 | `reported_questions` | Student-reported issues | `user_id`, `question_id`, `reason`, `status`, `admin_notes` |
| 15 | `syllabus_progress` | Student syllabus completion tracking | `user_id`, `topic_id`, `is_completed` |

### Enums

| Enum | Values |
|------|--------|
| `question_type_enum` | `single_choice`, `multiple_choice`, `numerical` |
| `difficulty_enum` | `easy`, `medium`, `hard` |
| `user_role_enum` | `student`, `admin` |
| `test_status_enum` | `draft`, `active`, `archived` |
| `attempt_source_enum` | `test`, `subject`, `chapter`, `topic` |
| `attempt_status_enum` | `in_progress`, `completed`, `abandoned` |
| `report_status_enum` | `pending`, `reviewed`, `resolved`, `dismissed` |

### Entity Relationships

```
exams ─┬─ subjects ─── chapters ─── topics ─── questions ─── options
       │                                           │
       ├─ tests ─── test_questions ────────────────┘
       │     │
       │     └─ test_attempts ─── user_answers
       │
       ├─ profiles ─┬─ bookmarks
       │            ├─ leaderboard_scores
       │            ├─ reported_questions
       │            └─ syllabus_progress
       │
       └─ leaderboard_scores
```

---

## Auth APIs

| # | Operation | Endpoint | Description |
|---|-----------|----------|-------------|
| 1 | **Get Session** | `supabase.auth.getSession()` | Retrieves current active session on app load |
| 2 | **Auth Listener** | `supabase.auth.onAuthStateChange(callback)` | Listens for sign-in, sign-out, and token refresh events |
| 3 | **Sign In** | `supabase.auth.signInWithPassword({ email, password })` | Email/password login for students and admins |
| 4 | **Sign Up** | `supabase.auth.signUp({ email, password, options: { data: { full_name, exam_id } } })` | Register new student account. Triggers `handle_new_user()` DB function to auto-create profile |
| 5 | **Sign Out** | `supabase.auth.signOut()` | End current session |

**File:** `src/stores/authStore.ts`

---

## Shared APIs

Used by both student and admin roles.

| # | Table | Operation | Query | Description | File |
|---|-------|-----------|-------|-------------|------|
| 1 | `profiles` | SELECT | `.select('*, exam:exams(*)').eq('id', userId).single()` | Fetch user profile with joined exam data | `authStore.ts` |
| 2 | `profiles` | UPDATE | `.update({ full_name, phone, bio, avatar_url, exam_id }).eq('id', userId)` | Update user profile (name, phone, bio, avatar, exam) | `authStore.ts` |
| 3 | `exams` | SELECT | `.select('*').eq('is_active', true).order('name')` | List active exams for registration/profile dropdown | `RegisterPage.tsx` |

---

## Student APIs

### Dashboard (`src/pages/student/DashboardPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 1 | `test_attempts` | SELECT | `.select('*').eq('user_id', id).eq('status', 'completed').order('completed_at', { ascending: false })` | Load completed attempts for stats (total tests, avg score, accuracy) |
| 2 | `tests` | SELECT | `.select('*').eq('status', 'active').not('scheduled_at', 'is', null).gt('scheduled_at', now).order('scheduled_at').limit(1)` | Load next upcoming scheduled test |
| 3 | `syllabus_progress` | SELECT | `.select('topic_id, is_completed').eq('user_id', id)` | Load user's syllabus completion progress |
| 4 | `topics` | SELECT | `.select('id, chapter:chapters!inner(subject:subjects!inner(exam_id))').eq('chapters.subjects.exam_id', examId)` | Count total topics in user's exam curriculum |

### Exam Browser (`src/pages/student/ExamBrowserPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 5 | `subjects` | SELECT | `.select('*').eq('exam_id', examId).order('sort_order')` | Load subjects for user's exam |
| 6 | `questions` | SELECT | `.select('id', { count: 'exact', head: true }).eq('topics.chapters.subject_id', subjectId)` | Count total questions per subject |
| 7 | `chapters` | SELECT | `.select('*').eq('subject_id', subjectId).order('sort_order')` | Load chapters for selected subject |
| 8 | `topics` | SELECT | `.select('*').eq('chapter_id', chapterId).order('sort_order')` | Load topics for selected chapter |
| 9 | `questions` | SELECT | `.select('id').eq('topic_id', id).eq('is_active', true).limit(5)` | Get questions for topic-level practice |
| 10 | `topics` | SELECT | `.select('id').eq('chapter_id', id)` | Get topic IDs for chapter-level practice |
| 11 | `questions` | SELECT | `.select('id').in('topic_id', ids).eq('is_active', true).limit(5)` | Get questions across topics |
| 12 | `test_attempts` | INSERT | `.insert({ user_id, source_type, source_id, source_name, total_questions, total_marks, duration_minutes, status: 'in_progress' }).select().single()` | Create practice test attempt |
| 13 | `user_answers` | INSERT | `.insert([{ attempt_id, question_id, is_correct: null, time_spent_seconds: 0 }])` | Create placeholder answer rows |

### Test List (`src/pages/student/TestListPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 14 | `tests` | SELECT | `.select('*, exam:exams(*)').eq('exam_id', examId).eq('status', 'active').order('created_at', { ascending: false })` | Load exam-specific active tests |
| 15 | `tests` | SELECT | `.select('*, exam:exams(*)').eq('is_global', true).eq('status', 'active').order('created_at', { ascending: false })` | Load global active tests |
| 16 | `test_questions` | SELECT | `.select('question_id').eq('test_id', testId).order('sort_order')` | Get question IDs for a test |
| 17 | `test_attempts` | SELECT | `.select('id').eq('user_id', id).eq('test_id', testId).eq('status', 'completed').limit(1)` | Check if student already completed test |
| 18 | `test_attempts` | INSERT | `.insert({ user_id, test_id, source_type: 'test', source_id, source_name, total_questions, total_marks, duration_minutes, status: 'in_progress' }).select().single()` | Create formal test attempt |
| 19 | `user_answers` | INSERT | `.insert([{ attempt_id, question_id }])` | Create placeholder answer rows |

### Test Taking (`src/pages/student/TestTakingPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 20 | `test_attempts` | SELECT | `.select('*').eq('id', attemptId).single()` | Load test attempt details |
| 21 | `user_answers` | SELECT | `.select('question_id, selected_option_id').eq('attempt_id', attemptId)` | Load existing answers (resume state) |
| 22 | `questions` | SELECT | `.select('*, options(*)').in('id', questionIds)` | Load questions with options |
| 23 | `user_answers` | UPDATE | `.update({ selected_option_id, is_correct }).eq('attempt_id', id).eq('question_id', id)` | Save answer per question |
| 24 | `test_attempts` | UPDATE | `.update({ score, correct_answers, wrong_answers, skipped, time_taken_seconds, status: 'completed', completed_at }).eq('id', id)` | Finalize test with results |
| 25 | `leaderboard_scores` | SELECT | `.select('*').eq('user_id', id).eq('exam_id', id).single()` | Check existing leaderboard entry |
| 26 | `leaderboard_scores` | UPDATE | `.update({ total_score, tests_taken, total_correct, total_questions }).eq('id', id)` | Update leaderboard score |
| 27 | `leaderboard_scores` | INSERT | `.insert({ user_id, exam_id, total_score, tests_taken, total_correct, total_questions })` | Insert new leaderboard entry |

### Test Result (`src/pages/student/TestResultPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 28 | `test_attempts` | SELECT | `.select('*').eq('id', attemptId).single()` | Load attempt result |
| 29 | `user_answers` | SELECT | `.select('*, question:questions(*, options(*))').eq('attempt_id', attemptId)` | Load answers with full question data |
| 30 | `bookmarks` | SELECT | `.select('question_id').eq('user_id', id)` | Load bookmarked question IDs |
| 31 | `bookmarks` | DELETE | `.delete().eq('user_id', id).eq('question_id', id)` | Remove bookmark |
| 32 | `bookmarks` | UPSERT | `.upsert({ user_id, question_id, notes }, { onConflict: 'user_id,question_id' })` | Add/update bookmark |
| 33 | `reported_questions` | INSERT | `.insert({ user_id, question_id, reason, status: 'pending' })` | Report a problematic question |

### Bookmarks (`src/pages/student/BookmarksPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 34 | `bookmarks` | SELECT | `.select('*, question:questions(*, options(*))').eq('user_id', id).order('created_at', { ascending: false })` | Load all bookmarks with question data |
| 35 | `bookmarks` | DELETE | `.delete().eq('id', bookmarkId)` | Remove a bookmark |

### Analytics (`src/pages/student/AnalyticsPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 36 | `test_attempts` | SELECT | `.select('*').eq('user_id', id).eq('status', 'completed').order('completed_at', { ascending: true })` | Load all completed attempts for trend charts |

### Leaderboard (`src/pages/student/LeaderboardPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 37 | `leaderboard_scores` | SELECT | `.select('*, profile:profiles(full_name, avatar_url)').eq('exam_id', examId).order('total_score', { ascending: false }).limit(50)` | Load top 50 leaderboard entries with profile data |

### Profile (`src/pages/student/ProfilePage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 38 | `exams` | SELECT | `.select('*').eq('is_active', true).order('name')` | Load active exams for exam selector |
| 39 | `bookmarks` | SELECT | `.select('*, question:questions(*, options(*))', { count: 'exact' }).eq('user_id', id).order('created_at', { ascending: false }).limit(3)` | Load recent bookmarks with total count |

---

## Admin APIs

### Dashboard (`src/pages/admin/DashboardPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 1 | `profiles` | SELECT | `.select('id', { count: 'exact', head: true })` | Count total users |
| 2 | `exams` | SELECT | `.select('id', { count: 'exact', head: true })` | Count total exams |
| 3 | `questions` | SELECT | `.select('id', { count: 'exact', head: true })` | Count total questions |
| 4 | `tests` | SELECT | `.select('id', { count: 'exact', head: true })` | Count total tests |
| 5 | `test_attempts` | SELECT | `.select('id', { count: 'exact', head: true })` | Count total test attempts |

### Exam Management (`src/pages/admin/ExamManagementPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 6 | `exams` | SELECT | `.select('*').order('name')` | Load all exams |
| 7 | `subjects` | SELECT | `.select('*').eq('exam_id', examId).order('sort_order')` | Load subjects for exam |
| 8 | `chapters` | SELECT | `.select('*').eq('subject_id', subjectId).order('sort_order')` | Load chapters for subject |
| 9 | `topics` | SELECT | `.select('*').eq('chapter_id', chapterId).order('sort_order')` | Load topics for chapter |
| 10 | `exams` | INSERT | `.insert({ name, description })` | Create exam |
| 11 | `exams` | UPDATE | `.update({ name, description }).eq('id', id)` | Update exam |
| 12 | `subjects` | INSERT | `.insert({ exam_id, name, description, sort_order })` | Create subject |
| 13 | `subjects` | UPDATE | `.update({ name, description, sort_order }).eq('id', id)` | Update subject |
| 14 | `chapters` | INSERT | `.insert({ subject_id, name, sort_order })` | Create chapter |
| 15 | `chapters` | UPDATE | `.update({ name, sort_order }).eq('id', id)` | Update chapter |
| 16 | `topics` | INSERT | `.insert({ chapter_id, name, sort_order })` | Create topic |
| 17 | `topics` | UPDATE | `.update({ name, sort_order }).eq('id', id)` | Update topic |
| 18 | `(any)` | DELETE | `.delete().eq('id', id)` | Generic delete for exams/subjects/chapters/topics |

### Question Management (`src/pages/admin/QuestionManagementPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 19 | `exams` | SELECT | `.select('*').order('name')` | Load exams for filter |
| 20 | `subjects` | SELECT | `.select('*').eq('exam_id', id).order('sort_order')` | Load subjects for filter |
| 21 | `chapters` | SELECT | `.select('*').eq('subject_id', id).order('sort_order')` | Load chapters for filter |
| 22 | `topics` | SELECT | `.select('*').eq('chapter_id', id).order('sort_order')` | Load topics for filter |
| 23 | `questions` | SELECT | `.select('*, options(*)').order('created_at', { ascending: false }).limit(50)` | Load questions (with optional topic_id filter) |
| 24 | `questions` | INSERT | `.insert({ topic_id, question_text, question_type, difficulty, marks, negative_marks, explanation, year }).select().single()` | Create question |
| 25 | `questions` | UPDATE | `.update({ topic_id, question_text, question_type, difficulty, marks, negative_marks, explanation, year }).eq('id', id)` | Update question |
| 26 | `questions` | DELETE | `.delete().eq('id', id)` | Delete question |
| 27 | `options` | INSERT | `.insert([{ question_id, option_text, is_correct, explanation, sort_order }])` | Create options for question |
| 28 | `options` | DELETE | `.delete().eq('question_id', id)` | Delete all options for question (before re-insert on edit) |

### Test Management (`src/pages/admin/TestManagementPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 29 | `tests` | SELECT | `.select('*, exam:exams(name)').order('created_at', { ascending: false })` | Load all tests with exam name |
| 30 | `exams` | SELECT | `.select('*').order('name')` | Load exams for test creation |
| 31 | `tests` | INSERT | `.insert({ title, description, exam_id, is_global, duration_minutes, total_marks, shuffle_questions, allow_multiple_attempts, instructions, status, scheduled_at, scheduled_end_at })` | Create test |
| 32 | `tests` | UPDATE | `.update(testData).eq('id', id)` | Update test |
| 33 | `tests` | DELETE | `.delete().eq('id', id)` | Delete test |

### Bulk Upload (`src/pages/admin/BulkUploadPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 34 | `exams` | SELECT | `.select('id').eq('name', name).single()` | Find exam by name (upsert logic) |
| 35 | `exams` | INSERT | `.insert({ name }).select().single()` | Create exam if not found |
| 36 | `subjects` | SELECT | `.select('id').eq('exam_id', id).eq('name', name).single()` | Find subject by name+exam |
| 37 | `subjects` | INSERT | `.insert({ exam_id, name }).select().single()` | Create subject if not found |
| 38 | `chapters` | SELECT | `.select('id').eq('subject_id', id).eq('name', name).single()` | Find chapter by name+subject |
| 39 | `chapters` | INSERT | `.insert({ subject_id, name }).select().single()` | Create chapter if not found |
| 40 | `topics` | SELECT | `.select('id').eq('chapter_id', id).eq('name', name).single()` | Find topic by name+chapter |
| 41 | `topics` | INSERT | `.insert({ chapter_id, name }).select().single()` | Create topic if not found |
| 42 | `questions` | INSERT | `.insert({ topic_id, question_text, question_type, difficulty, marks, negative_marks, explanation, year }).select().single()` | Create question |
| 43 | `options` | INSERT | `.insert([{ question_id, option_text, is_correct, explanation, sort_order }])` | Create options for question |

### Reported Questions (`src/pages/admin/ReportedQuestionsPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 44 | `reported_questions` | SELECT | `.select('*, question:questions(question_text), profile:profiles(full_name, email)').order('created_at', { ascending: false })` | Load reports with question text and reporter info |
| 45 | `reported_questions` | UPDATE | `.update({ status, resolved_at, admin_notes }).eq('id', id)` | Resolve/dismiss report |

### User Analytics (`src/pages/admin/UserAnalyticsPage.tsx`)

| # | Table | Op | Query | Description |
|---|-------|----|-------|-------------|
| 46 | `profiles` | SELECT | `.select('*, exam:exams(name)').eq('role', 'student').order('created_at', { ascending: false })` | Load all student profiles with exam name |

---

## Table Summary

| Table | SELECT | INSERT | UPDATE | DELETE | UPSERT |
|-------|--------|--------|--------|--------|--------|
| `profiles` | 3 | — | 1 | — | — |
| `exams` | 6 | 3 | 2 | 1 | — |
| `subjects` | 4 | 2 | 2 | 1 | — |
| `chapters` | 4 | 2 | 1 | 1 | — |
| `topics` | 5 | 2 | 1 | 1 | — |
| `questions` | 5 | 2 | 1 | 1 | — |
| `options` | — | 3 | — | 1 | — |
| `tests` | 3 | 1 | 1 | 1 | — |
| `test_questions` | 1 | — | — | — | — |
| `test_attempts` | 4 | 2 | 1 | — | — |
| `user_answers` | 2 | 2 | 1 | — | — |
| `bookmarks` | 3 | — | — | 2 | 1 |
| `leaderboard_scores` | 1 | 1 | 1 | — | — |
| `reported_questions` | 1 | 1 | 1 | — | — |
| `syllabus_progress` | 1 | — | — | — | — |

**Total: 97 Supabase calls** (5 auth + 92 data queries) across 14 files.  
**No RPC calls or Storage calls used.**

---

## RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| `profiles` | Read all | `SELECT` — anyone authenticated |
| `profiles` | Update own | `UPDATE` — `auth.uid() = id` |
| `exams` | Read all | `SELECT` — public |
| `exams` | Admin CRUD | `ALL` — `role = 'admin'` |
| `subjects` | Read all | `SELECT` — public |
| `subjects` | Admin CRUD | `ALL` — `role = 'admin'` |
| `chapters` | Read all | `SELECT` — public |
| `chapters` | Admin CRUD | `ALL` — `role = 'admin'` |
| `topics` | Read all | `SELECT` — public |
| `topics` | Admin CRUD | `ALL` — `role = 'admin'` |
| `questions` | Read all | `SELECT` — public |
| `questions` | Admin CRUD | `ALL` — `role = 'admin'` |
| `options` | Read all | `SELECT` — public |
| `options` | Admin CRUD | `ALL` — `role = 'admin'` |
| `tests` | Read all | `SELECT` — public |
| `tests` | Admin CRUD | `ALL` — `role = 'admin'` |
| `test_questions` | Read all | `SELECT` — public |
| `test_questions` | Admin CRUD | `ALL` — `role = 'admin'` |
| `test_attempts` | Users own | `ALL` — `auth.uid() = user_id` |
| `test_attempts` | Admin read | `SELECT` — `role = 'admin'` |
| `user_answers` | Users own | `ALL` — attempt belongs to user |
| `user_answers` | Admin read | `SELECT` — `role = 'admin'` |
| `bookmarks` | Users own | `ALL` — `auth.uid() = user_id` |
| `leaderboard_scores` | Read all | `SELECT` — public |
| `leaderboard_scores` | Users insert | `INSERT` — `auth.uid() = user_id` |
| `leaderboard_scores` | Users update | `UPDATE` — `auth.uid() = user_id` |
| `reported_questions` | Users create | `INSERT` — `auth.uid() = user_id` |
| `reported_questions` | Admin CRUD | `ALL` — `role = 'admin'` |
| `syllabus_progress` | Users own | `ALL` — `auth.uid() = user_id` |
| `syllabus_progress` | Admin read | `SELECT` — `role = 'admin'` |

---

## SQL Commands

All SQL is located in the migration file: `supabase/migrations/20260324000000_exampyq_schema.sql`

The schema includes:
- 15 tables with proper foreign keys and cascading deletes
- 6 custom enums for type safety
- `handle_updated_at()` trigger on `profiles`, `questions`, `tests`, `leaderboard_scores`
- `handle_new_user()` trigger on `auth.users` to auto-create profile on signup
- Full RLS policies for every table
- Performance indexes on all foreign keys and sort columns
- UPDATE-1: Scheduled tests (`scheduled_at`, `scheduled_end_at`) + `syllabus_progress` table
- UPDATE-2: DiceBear avatar system using existing `avatar_url` column
