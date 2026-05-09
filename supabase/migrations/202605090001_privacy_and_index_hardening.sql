-- allExamsPYQ privacy and index hardening

create or replace function public.get_leaderboard(
  p_exam_id uuid,
  p_limit integer default 50
)
returns table (
  id uuid,
  user_id uuid,
  total_score integer,
  tests_taken integer,
  total_correct integer,
  total_questions integer,
  full_name text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  safe_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    score.id,
    score.user_id,
    score.total_score,
    score.tests_taken,
    score.total_correct,
    score.total_questions,
    profile.full_name,
    profile.avatar_url
  from public.leaderboard_scores score
  left join public.profiles profile on profile.id = score.user_id
  where score.exam_id = p_exam_id
  order by score.total_score desc, score.updated_at asc
  limit safe_limit;
end;
$$;

revoke all on function public.get_leaderboard(uuid, integer) from public;
grant execute on function public.get_leaderboard(uuid, integer) to authenticated;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable" on public.profiles
for select using (auth.uid() = id or public.is_admin());

create index if not exists idx_profiles_exam on public.profiles(exam_id) where exam_id is not null;
create index if not exists idx_test_attempts_test_completed on public.test_attempts(test_id, completed_at desc) where test_id is not null;
create index if not exists idx_test_questions_question on public.test_questions(question_id);
create index if not exists idx_reported_user_created on public.reported_questions(user_id, created_at desc);
create index if not exists idx_reported_question on public.reported_questions(question_id);
create index if not exists idx_syllabus_topic on public.syllabus_progress(topic_id);
create index if not exists idx_user_answers_selected_option on public.user_answers(selected_option_id) where selected_option_id is not null;
