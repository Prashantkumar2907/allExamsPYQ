-- allExamsPYQ initial Supabase schema
-- Apply locally with: supabase db reset

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

do $$
begin
  create type public.question_type_enum as enum ('single_choice', 'multiple_choice', 'numerical');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.difficulty_enum as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_role_enum as enum ('student', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.test_status_enum as enum ('draft', 'active', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.attempt_source_enum as enum ('test', 'subject', 'chapter', 'topic');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.attempt_status_enum as enum ('in_progress', 'completed', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status_enum as enum ('pending', 'reviewed', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (exam_id, name)
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (chapter_id, name)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete restrict,
  question_text text not null,
  question_type public.question_type_enum not null default 'single_choice',
  difficulty public.difficulty_enum not null default 'medium',
  marks integer not null default 4 check (marks >= 0),
  negative_marks integer not null default 1 check (negative_marks >= 0),
  explanation text,
  year integer check (year is null or (year between 1900 and 2100)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  explanation text,
  sort_order integer not null default 0
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role public.user_role_enum not null default 'student',
  exam_id uuid references public.exams(id) on delete set null,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  exam_id uuid references public.exams(id) on delete set null,
  is_global boolean not null default false,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  total_marks integer not null default 100 check (total_marks >= 0),
  shuffle_questions boolean not null default true,
  allow_multiple_attempts boolean not null default false,
  instructions text,
  status public.test_status_enum not null default 'draft',
  scheduled_at timestamptz,
  scheduled_end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end_at is null or scheduled_at is null or scheduled_end_at > scheduled_at)
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  sort_order integer not null default 0,
  unique (test_id, question_id)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid references public.tests(id) on delete set null,
  source_type public.attempt_source_enum not null,
  source_id uuid not null,
  source_name text not null,
  score integer not null default 0,
  total_marks integer not null default 0,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  skipped integer not null default 0,
  time_taken_seconds integer,
  duration_minutes integer,
  status public.attempt_status_enum not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.options(id) on delete set null,
  is_correct boolean,
  time_spent_seconds integer not null default 0,
  unique (attempt_id, question_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score integer not null default 0,
  tests_taken integer not null default 0,
  total_correct integer not null default 0,
  total_questions integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (exam_id, user_id)
);

create table if not exists public.reported_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null,
  description text,
  status public.report_status_enum not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.syllabus_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, topic_id)
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists on_question_updated on public.questions;
create trigger on_question_updated before update on public.questions
for each row execute function public.handle_updated_at();

drop trigger if exists on_test_updated on public.tests;
create trigger on_test_updated before update on public.tests
for each row execute function public.handle_updated_at();

create or replace function public.handle_leaderboard_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_leaderboard_updated on public.leaderboard_scores;
create trigger on_leaderboard_updated before update on public.leaderboard_scores
for each row execute function public.handle_leaderboard_updated();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, exam_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role_enum, 'student'),
    nullif(new.raw_user_meta_data->>'exam_id', '')::uuid
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    exam_id = excluded.exam_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create index if not exists idx_subjects_exam on public.subjects(exam_id);
create index if not exists idx_chapters_subject on public.chapters(subject_id);
create index if not exists idx_topics_chapter on public.topics(chapter_id);
create index if not exists idx_questions_topic_active on public.questions(topic_id, is_active);
create index if not exists idx_options_question_sort on public.options(question_id, sort_order);
create index if not exists idx_test_questions_test_sort on public.test_questions(test_id, sort_order);
create index if not exists idx_test_attempts_user_status on public.test_attempts(user_id, status);
create index if not exists idx_test_attempts_completed on public.test_attempts(user_id, completed_at desc) where status = 'completed';
create index if not exists idx_user_answers_attempt on public.user_answers(attempt_id);
create index if not exists idx_bookmarks_user_question on public.bookmarks(user_id, question_id);
create index if not exists idx_leaderboard_exam_score on public.leaderboard_scores(exam_id, total_score desc);
create index if not exists idx_reported_pending on public.reported_questions(status) where status = 'pending';
create index if not exists idx_syllabus_user on public.syllabus_progress(user_id);
create index if not exists idx_tests_active_exam on public.tests(status, exam_id);
create index if not exists idx_tests_scheduled on public.tests(scheduled_at) where scheduled_at is not null;

alter table public.exams enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.user_answers enable row level security;
alter table public.bookmarks enable row level security;
alter table public.leaderboard_scores enable row level security;
alter table public.reported_questions enable row level security;
alter table public.syllabus_progress enable row level security;

drop policy if exists "Read exams" on public.exams;
create policy "Read exams" on public.exams for select using (true);
drop policy if exists "Admins manage exams" on public.exams;
create policy "Admins manage exams" on public.exams for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read subjects" on public.subjects;
create policy "Read subjects" on public.subjects for select using (true);
drop policy if exists "Admins manage subjects" on public.subjects;
create policy "Admins manage subjects" on public.subjects for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read chapters" on public.chapters;
create policy "Read chapters" on public.chapters for select using (true);
drop policy if exists "Admins manage chapters" on public.chapters;
create policy "Admins manage chapters" on public.chapters for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read topics" on public.topics;
create policy "Read topics" on public.topics for select using (true);
drop policy if exists "Admins manage topics" on public.topics;
create policy "Admins manage topics" on public.topics for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read active questions" on public.questions;
create policy "Read active questions" on public.questions for select using (is_active or public.is_admin());
drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions" on public.questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read options" on public.options;
create policy "Read options" on public.options for select using (true);
drop policy if exists "Admins manage options" on public.options;
create policy "Admins manage options" on public.options for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable" on public.profiles for select using (auth.uid() is not null);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read active tests" on public.tests;
create policy "Read active tests" on public.tests for select using (status = 'active' or public.is_admin());
drop policy if exists "Admins manage tests" on public.tests;
create policy "Admins manage tests" on public.tests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read test questions" on public.test_questions;
create policy "Read test questions" on public.test_questions for select using (true);
drop policy if exists "Admins manage test questions" on public.test_questions;
create policy "Admins manage test questions" on public.test_questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users manage own attempts" on public.test_attempts;
create policy "Users manage own attempts" on public.test_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Admins read attempts" on public.test_attempts;
create policy "Admins read attempts" on public.test_attempts for select using (public.is_admin());

drop policy if exists "Users manage own answers" on public.user_answers;
create policy "Users manage own answers" on public.user_answers
for all using (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = user_answers.attempt_id
    and test_attempts.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = user_answers.attempt_id
    and test_attempts.user_id = auth.uid()
  )
);
drop policy if exists "Admins read answers" on public.user_answers;
create policy "Admins read answers" on public.user_answers for select using (public.is_admin());

drop policy if exists "Users manage own bookmarks" on public.bookmarks;
create policy "Users manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Read leaderboard" on public.leaderboard_scores;
create policy "Read leaderboard" on public.leaderboard_scores for select using (true);
drop policy if exists "Users manage own leaderboard" on public.leaderboard_scores;
create policy "Users manage own leaderboard" on public.leaderboard_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Admins manage leaderboard" on public.leaderboard_scores;
create policy "Admins manage leaderboard" on public.leaderboard_scores for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users create reports" on public.reported_questions;
create policy "Users create reports" on public.reported_questions for insert with check (auth.uid() = user_id);
drop policy if exists "Users read own reports" on public.reported_questions;
create policy "Users read own reports" on public.reported_questions for select using (auth.uid() = user_id);
drop policy if exists "Admins manage reports" on public.reported_questions;
create policy "Admins manage reports" on public.reported_questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users manage own syllabus" on public.syllabus_progress;
create policy "Users manage own syllabus" on public.syllabus_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Admins read syllabus" on public.syllabus_progress;
create policy "Admins read syllabus" on public.syllabus_progress for select using (public.is_admin());

