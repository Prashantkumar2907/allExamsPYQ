# allExamsPYQ — Application Development Guide

> A comprehensive exam preparation platform where students practice previous year questions (PYQs), take tests, review detailed explanations, and track performance through rich analytics.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features by Role](#features-by-role)
5. [Database Schema](#database-schema)
6. [Analytics Breakdown](#analytics-breakdown)
7. [Design System](#design-system)
8. [Page Structure](#page-structure)
9. [State Management](#state-management)

---

## Application Overview

**allExamsPYQ** is a full-stack exam preparation web app built with React and Supabase. Students browse exam hierarchies (Exam → Subject → Chapter → Topic), take timed tests, receive instant results with per-option explanations, bookmark questions, and track their performance through detailed analytics dashboards. Admins manage the entire content pipeline and monitor platform health.

### Core Value Propositions
- **PYQ-Focused**: Every question is from an actual previous year exam paper
- **Explanation-Rich**: Each answer option shows why it's correct or wrong
- **Analytics-Driven**: Multi-dimensional performance tracking with visual charts
- **Competitive**: Real-time leaderboards per exam
- **Adaptive**: Practice at any granularity — topic, chapter, subject, or full test

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | UI framework |
| Styling | Tailwind CSS v4.1 | Utility-first CSS |
| Animations | Framer Motion (`motion`) | Page transitions, micro-interactions |
| State | Zustand v5 | Auth store, theme store |
| Backend | Supabase (PostgreSQL) | Database, auth, RLS, real-time |
| Charts | Recharts | Analytics visualizations |
| Icons | Lucide React | Consistent SVG icon set |
| UI Primitives | Radix UI | Accessible dialog, select, tabs, dropdown |
| Avatars | DiceBear | Dynamic avatar generation |
| Build | Vite 6.2 | Fast dev server + production builds |

---

## Architecture

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Router + auth guard
├── index.css             # Global styles + design tokens
├── components/
│   ├── layout/           # AppLayout, Sidebar, Header
│   ├── shared/           # StatsCard, EmptyState, LoadingSpinner
│   └── ui/               # Button, Card, Dialog, Input, Select, Tabs, Badge, Avatar
├── pages/
│   ├── auth/             # LoginPage, RegisterPage
│   ├── student/          # Dashboard, ExamBrowser, TestList, TestTaking, TestResult, Analytics, Leaderboard, Bookmarks, Profile
│   └── admin/            # Dashboard, ExamManagement, QuestionManagement, TestManagement, BulkUpload, ReportedQuestions, UserAnalytics, Profile
├── stores/               # Zustand stores (authStore, themeStore)
├── lib/                  # Supabase client, utils, constants, avatar config
└── types/                # TypeScript type definitions
```

---

## Features by Role

### Student Features

| Feature | Description | Page |
|---------|-------------|------|
| **Dashboard** | Quick stats (tests taken, avg score, accuracy), upcoming live tests, syllabus progress tracker, quick actions | `DashboardPage` |
| **Exam Browser** | Hierarchical navigation: Exam → Subjects → Chapters → Topics. Start practice tests at any level | `ExamBrowserPage` |
| **Test List** | Browse available formal tests (exam-specific + global). See duration, marks, question count. Start test | `TestListPage` |
| **Test Taking** | Timed test interface with question navigation panel, flag questions, auto-submit on timeout | `TestTakingPage` |
| **Test Result** | Comprehensive result: score card, per-question review with **option-level explanations** (why right/wrong), bookmark questions, report issues | `TestResultPage` |
| **Analytics** | Multi-chart analytics dashboard: tests over time, accuracy trends, subject-wise breakdown, difficulty analysis, time analysis | `AnalyticsPage` |
| **Leaderboard** | Exam-specific rankings with podium display for top 3, paginated list with your rank highlighted | `LeaderboardPage` |
| **Bookmarks** | Saved questions with notes, filter by subject, quick review mode | `BookmarksPage` |
| **Profile** | Edit name, phone, bio, select avatar, change exam, recent bookmarks | `ProfilePage` |

### Admin Features

| Feature | Description | Page |
|---------|-------------|------|
| **Dashboard** | Platform overview: total users, exams, questions, tests, attempts. Recent activity chart | `DashboardPage` |
| **Exam Management** | Full CRUD for Exams → Subjects → Chapters → Topics hierarchy | `ExamManagementPage` |
| **Question Management** | Create/edit/delete questions with options, explanations, difficulty, marks. Filter by exam/subject/chapter/topic | `QuestionManagementPage` |
| **Test Management** | Create/edit/delete tests. Set exam, duration, marks, scheduling, global flag | `TestManagementPage` |
| **Bulk Upload** | CSV upload for questions with auto-creation of exam hierarchy | `BulkUploadPage` |
| **Reported Questions** | Review student-reported issues. Resolve/dismiss with admin notes | `ReportedQuestionsPage` |
| **User Analytics** | Student distribution by exam, student list with join dates | `UserAnalyticsPage` |
| **Profile** | Admin profile management | `ProfilePage` |

---

## Database Schema

### Tables (15 total)

| Table | Primary Key | Description |
|-------|------------|-------------|
| `exams` | uuid | Competitive exams (UPSC, GATE, etc.) |
| `subjects` | uuid | Subjects within an exam (FK: exam_id) |
| `chapters` | uuid | Chapters within a subject (FK: subject_id) |
| `topics` | uuid | Topics within a chapter (FK: chapter_id) |
| `questions` | uuid | PYQ questions (FK: topic_id). Includes type, difficulty, marks, negative marks, year, explanation |
| `options` | uuid | Answer options (FK: question_id). Each has is_correct flag and explanation text |
| `profiles` | uuid (FK: auth.users) | User profiles: name, email, role, exam_id, avatar, bio, phone |
| `tests` | uuid | Admin-created tests: title, exam, duration, marks, status, scheduling |
| `test_questions` | uuid | Junction: test ↔ question with sort order |
| `test_attempts` | uuid | Student attempts: user, test/source info, score, status, timing |
| `user_answers` | uuid | Per-question answers: selected option, is_correct, time spent |
| `bookmarks` | uuid | User bookmarked questions with optional notes |
| `leaderboard_scores` | uuid | Aggregated per-exam leaderboard: total score, tests taken, accuracy |
| `reported_questions` | uuid | Student-reported question issues with admin workflow |
| `syllabus_progress` | uuid | Per-topic completion tracking for syllabus progress |

### Enums
- `question_type_enum`: single_choice, multiple_choice, numerical
- `difficulty_enum`: easy, medium, hard
- `user_role_enum`: student, admin
- `test_status_enum`: draft, active, archived
- `attempt_source_enum`: test, subject, chapter, topic
- `attempt_status_enum`: in_progress, completed, abandoned
- `report_status_enum`: pending, reviewed, resolved, dismissed

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

### RLS Policies

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
| `leaderboard_scores` | Users insert/update | `INSERT`/`UPDATE` — `auth.uid() = user_id` |
| `reported_questions` | Users create | `INSERT` — `auth.uid() = user_id` |
| `reported_questions` | Admin CRUD | `ALL` — `role = 'admin'` |
| `syllabus_progress` | Users own | `ALL` — `auth.uid() = user_id` |
| `syllabus_progress` | Admin read | `SELECT` — `role = 'admin'` |

### Full SQL Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. exams
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. subjects
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. chapters
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. topics
create table public.topics (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. questions
create type question_type_enum as enum ('single_choice', 'multiple_choice', 'numerical');
create type difficulty_enum as enum ('easy', 'medium', 'hard');

create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references public.topics(id) on delete restrict not null,
  question_text text not null,
  question_type question_type_enum default 'single_choice' not null,
  difficulty difficulty_enum default 'medium' not null,
  marks integer default 4 not null,
  negative_marks integer default 1 not null,
  explanation text,
  year integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. options
create table public.options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  option_text text not null,
  is_correct boolean default false not null,
  explanation text,
  sort_order integer default 0 not null
);

-- 7. profiles
create type user_role_enum as enum ('student', 'admin');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role user_role_enum default 'student' not null,
  exam_id uuid references public.exams(id) on delete set null,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. tests
create type test_status_enum as enum ('draft', 'active', 'archived');

create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  exam_id uuid references public.exams(id) on delete set null,
  is_global boolean default false not null,
  duration_minutes integer default 60 not null,
  total_marks integer default 100 not null,
  shuffle_questions boolean default true not null,
  allow_multiple_attempts boolean default false not null,
  instructions text,
  status test_status_enum default 'draft' not null,
  scheduled_at timestamptz,
  scheduled_end_at timestamptz,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. test_questions
create table public.test_questions (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete restrict not null,
  sort_order integer default 0 not null,
  unique(test_id, question_id)
);

-- 10. test_attempts
create type attempt_source_enum as enum ('test', 'subject', 'chapter', 'topic');
create type attempt_status_enum as enum ('in_progress', 'completed', 'abandoned');

create table public.test_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  test_id uuid references public.tests(id) on delete set null,
  source_type attempt_source_enum not null,
  source_id uuid not null,
  source_name text not null,
  score integer default 0 not null,
  total_marks integer default 0 not null,
  total_questions integer default 0 not null,
  correct_answers integer default 0 not null,
  wrong_answers integer default 0 not null,
  skipped integer default 0 not null,
  time_taken_seconds integer,
  duration_minutes integer,
  status attempt_status_enum default 'in_progress' not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 11. user_answers
create table public.user_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.test_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete restrict not null,
  selected_option_id uuid references public.options(id) on delete set null,
  is_correct boolean,
  time_spent_seconds integer default 0 not null,
  unique(attempt_id, question_id)
);

-- 12. bookmarks
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, question_id)
);

-- 13. leaderboard_scores
create table public.leaderboard_scores (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_score integer default 0 not null,
  tests_taken integer default 0 not null,
  total_correct integer default 0 not null,
  total_questions integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(exam_id, user_id)
);

-- 14. reported_questions
create type report_status_enum as enum ('pending', 'reviewed', 'resolved', 'dismissed');

create table public.reported_questions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  reason text not null,
  description text,
  status report_status_enum default 'pending' not null,
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

-- 15. syllabus_progress
create table public.syllabus_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  is_completed boolean default false not null,
  completed_at timestamptz,
  unique(user_id, topic_id)
);

-- Triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger on_question_updated before update on public.questions for each row execute procedure public.handle_updated_at();
create trigger on_test_updated before update on public.tests for each row execute procedure public.handle_updated_at();
create trigger on_leaderboard_updated before update on public.leaderboard_scores for each row execute procedure public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table public.profiles enable row level security;
create policy "Allow users to read profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.exams enable row level security;
create policy "Read exams" on public.exams for select using (true);
create policy "Admin exams" on public.exams for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.subjects enable row level security;
create policy "Read subjects" on public.subjects for select using (true);
create policy "Admin subjects" on public.subjects for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.chapters enable row level security;
create policy "Read chapters" on public.chapters for select using (true);
create policy "Admin chapters" on public.chapters for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.topics enable row level security;
create policy "Read topics" on public.topics for select using (true);
create policy "Admin topics" on public.topics for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.questions enable row level security;
create policy "Read questions" on public.questions for select using (true);
create policy "Admin questions" on public.questions for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.options enable row level security;
create policy "Read options" on public.options for select using (true);
create policy "Admin options" on public.options for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.tests enable row level security;
create policy "Read tests" on public.tests for select using (true);
create policy "Admin tests" on public.tests for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.test_questions enable row level security;
create policy "Read test questions" on public.test_questions for select using (true);
create policy "Admin test questions" on public.test_questions for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.test_attempts enable row level security;
create policy "Users own attempts" on public.test_attempts for all using (auth.uid() = user_id);
create policy "Admin read attempts" on public.test_attempts for select using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.user_answers enable row level security;
create policy "Users own answers" on public.user_answers for all using (
  exists (select 1 from test_attempts where id = attempt_id and user_id = auth.uid())
);
create policy "Admin read answers" on public.user_answers for select using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.bookmarks enable row level security;
create policy "Users own bookmarks" on public.bookmarks for all using (auth.uid() = user_id);

alter table public.leaderboard_scores enable row level security;
create policy "Read leaderboard" on public.leaderboard_scores for select using (true);
create policy "Insert leaderboard" on public.leaderboard_scores for insert with check (auth.uid() = user_id);
create policy "Update leaderboard" on public.leaderboard_scores for update using (auth.uid() = user_id);

alter table public.reported_questions enable row level security;
create policy "Users create reports" on public.reported_questions for insert with check (auth.uid() = user_id);
create policy "Admin handle reports" on public.reported_questions for all using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.syllabus_progress enable row level security;
create policy "Users own syllabus" on public.syllabus_progress for all using (auth.uid() = user_id);
create policy "Admin read syllabus" on public.syllabus_progress for select using ((select role from profiles where id = auth.uid()) = 'admin');

-- Indexes
create index idx_subjects_exam on public.subjects(exam_id);
create index idx_chapters_subject on public.chapters(subject_id);
create index idx_topics_chapter on public.topics(chapter_id);
create index idx_questions_topic on public.questions(topic_id);
create index idx_options_question on public.options(question_id);
create index idx_test_attempts_user on public.test_attempts(user_id);
create index idx_test_attempts_test on public.test_attempts(test_id);
create index idx_user_answers_attempt on public.user_answers(attempt_id);
create index idx_leaderboard_exam on public.leaderboard_scores(exam_id);
create index idx_leaderboard_score on public.leaderboard_scores(total_score desc);
create index idx_syllabus_progress_user on public.syllabus_progress(user_id);
create index idx_tests_scheduled on public.tests(scheduled_at) where scheduled_at is not null;
```

---

## Analytics Breakdown

### Student Analytics (what we track and visualize)

| Analytics Dimension | Chart Type | Data Source | Description |
|---------------------|-----------|-------------|-------------|
| **Tests Over Time** | Bar chart (monthly) | `test_attempts` grouped by month | How many tests completed per month |
| **Accuracy Trend** | Line chart (per test) | `test_attempts` correct/total over time | Accuracy % trajectory across attempts |
| **Score Distribution** | Histogram / Bar | `test_attempts` score ranges | Distribution of scores across all tests |
| **Subject-wise Accuracy** | Horizontal bar chart | `user_answers` joined with questions/topics/subjects | Accuracy % broken down by subject |
| **Difficulty Analysis** | Grouped bar / Radar | `user_answers` grouped by `questions.difficulty` | Performance by easy/medium/hard questions |
| **Time Analysis** | Bar chart | `user_answers.time_spent_seconds` | Avg time per question, time vs accuracy correlation |
| **Question Status** | Donut chart | `user_answers` per attempt | Correct / Wrong / Skipped breakdown |
| **Topic Mastery** | Heatmap / Progress bars | `user_answers` grouped by topic | Completion + accuracy per topic |
| **Comparison vs Average** | Multi-line chart | `test_attempts` user vs all users | How student performs vs platform average |
| **Streak / Consistency** | Calendar heatmap | `test_attempts.completed_at` dates | Study consistency visualization |
| **Improvement Rate** | Line chart with trendline | Score deltas between consecutive tests | Learning velocity |

### Admin Analytics

| Analytics Dimension | Chart Type | Data Source |
|---------------------|-----------|-------------|
| **Daily Attempts** | Area/Bar chart | `test_attempts` grouped by date |
| **Students by Exam** | Bar chart | `profiles` grouped by exam_id |
| **Questions by Difficulty** | Donut chart | `questions` grouped by difficulty |
| **Top Performing Tests** | Horizontal bar | `test_attempts` avg score per test |
| **User Growth** | Line chart | `profiles.created_at` over time |
| **Completion Rate** | Gauge / Number | `test_attempts` completed vs in_progress |

---

## Design System

### Color Palette (Primary: Teal)

**Light Mode:**
- Body: `#f7f9fb`
- Surface/Card: `#ffffff`
- Border: `#e2e8f0`
- Foreground: `#0f172a`
- Muted: `#64748b`
- Primary-500: `#4a9e8a` (buttons, links, chart accent)
- Primary-600: `#3e8675` (hover states)
- Primary-700: `#336d5f` (active states)

**Dark Mode:**
- Body: `#0b0f19`
- Surface/Card: `#131a2b`
- Border: `#1c2537`
- Foreground: `#e8edf3`
- Muted: `#8b9ab5`
- Primary uses same hues with opacity adjustments

### Chart Colors (all teal tonal variants)
```
#4a9e8a, #3e8675, #6fcdb5, #336d5f, #5ab89f, #28544a, #a3e1d1, #1d3b34
```

### Animation Guidelines
- Micro-interactions: 150–300ms, ease-out on enter
- Scale on press: 0.97 scale factor
- Page transitions: fade + slide-up (200ms)
- Stagger list items: 30ms per item
- Respect `prefers-reduced-motion`
- Only animate `transform` and `opacity`

### Spacing
- Base unit: 4px
- Card padding: `p-3.5` (14px)
- Section gaps: `space-y-4` (16px)
- Page padding: `p-3` (12px)
- Sidebar: 14rem (224px)
- Header: 3rem (48px)

### Typography
- Body: 14px (`text-sm`)
- Headings: 20px max on dashboard (`text-xl`)
- Labels: 13px (`text-[13px]`)
- Minimum: 12px (`text-xs`)
- Font: `system-ui, -apple-system, sans-serif`

---

## Page Structure

Every page fits within the viewport (`h-dvh`) with:
- Fixed sidebar (left, 14rem)
- Fixed header (top, 3rem)
- Scrollable content area (overflow-y-auto, custom thin scrollbar)
- No page-level scrolling — content is contained
- Responsive: sidebar collapses to overlay on mobile

---

## State Management

### Zustand Stores

**authStore** (persisted):
- `user`, `profile`, `session`, `loading`
- Actions: `signIn`, `signUp`, `signOut`, `updateProfile`, `initialize`

**themeStore** (persisted):
- `theme`: 'light' | 'dark' | 'system'
- Actions: `setTheme`, `toggleTheme`
- Applies `.dark` class to `documentElement`
