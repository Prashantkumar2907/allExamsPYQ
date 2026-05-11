-- Secure attempt submission and remove client-trusted score writes.

create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_answers jsonb default '[]'::jsonb
)
returns table (
  score integer,
  correct_answers integer,
  wrong_answers integer,
  skipped integer,
  total_questions integer,
  total_marks integer,
  time_taken_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_attempt public.test_attempts%rowtype;
  answer_item jsonb;
  answer_question_id uuid;
  answer_option_id uuid;
  answer_option_text text;
  updated_count integer;
  v_score integer := 0;
  v_correct integer := 0;
  v_wrong integer := 0;
  v_skipped integer := 0;
  v_total_questions integer := 0;
  v_total_marks integer := 0;
  v_time_taken integer := 0;
  v_exam_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_attempt_id is null then
    raise exception 'Attempt id is required.';
  end if;

  if coalesce(jsonb_typeof(p_answers), 'array') <> 'array' then
    raise exception 'Answers payload must be an array.';
  end if;

  select *
  into target_attempt
  from public.test_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'This test attempt could not be found.';
  end if;

  if target_attempt.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'You cannot submit this attempt.';
  end if;

  if target_attempt.status = 'completed' then
    score := target_attempt.score;
    correct_answers := target_attempt.correct_answers;
    wrong_answers := target_attempt.wrong_answers;
    skipped := target_attempt.skipped;
    total_questions := target_attempt.total_questions;
    total_marks := target_attempt.total_marks;
    time_taken_seconds := coalesce(target_attempt.time_taken_seconds, 0);
    return next;
    return;
  end if;

  if target_attempt.status <> 'in_progress' then
    raise exception 'Only in-progress attempts can be submitted.';
  end if;

  for answer_item in
    select value from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    begin
      answer_question_id := nullif(answer_item->>'question_id', '')::uuid;
      answer_option_text := nullif(answer_item->>'selected_option_id', '');
      answer_option_id := case
        when answer_option_text is null then null
        else answer_option_text::uuid
      end;
    exception when invalid_text_representation then
      raise exception 'Invalid answer payload.';
    end;

    if answer_question_id is null then
      raise exception 'Every answer needs a question id.';
    end if;

    if answer_option_id is not null and not exists (
      select 1
      from public.options opt
      where opt.id = answer_option_id
        and opt.question_id = answer_question_id
    ) then
      raise exception 'Selected option does not belong to its question.';
    end if;

    update public.user_answers answer
    set selected_option_id = answer_option_id
    where answer.attempt_id = p_attempt_id
      and answer.question_id = answer_question_id;

    get diagnostics updated_count = row_count;
    if updated_count = 0 then
      raise exception 'Question is not part of this attempt.';
    end if;
  end loop;

  update public.user_answers answer
  set is_correct = case
    when answer.selected_option_id is null then null
    else exists (
      select 1
      from public.options opt
      where opt.id = answer.selected_option_id
        and opt.question_id = answer.question_id
        and opt.is_correct = true
    )
  end
  where answer.attempt_id = p_attempt_id;

  select
    count(*)::integer,
    coalesce(sum(question.marks), 0)::integer,
    count(*) filter (where answer.selected_option_id is not null and answer.is_correct = true)::integer,
    count(*) filter (where answer.selected_option_id is not null and coalesce(answer.is_correct, false) = false)::integer,
    count(*) filter (where answer.selected_option_id is null)::integer,
    greatest(0, coalesce(sum(
      case
        when answer.selected_option_id is null then 0
        when answer.is_correct = true then question.marks
        else -question.negative_marks
      end
    ), 0))::integer
  into
    v_total_questions,
    v_total_marks,
    v_correct,
    v_wrong,
    v_skipped,
    v_score
  from public.user_answers answer
  join public.questions question on question.id = answer.question_id
  where answer.attempt_id = p_attempt_id;

  if v_total_questions = 0 then
    raise exception 'This attempt has no questions to submit.';
  end if;

  v_time_taken := greatest(0, floor(extract(epoch from (now() - target_attempt.started_at)))::integer);
  if target_attempt.duration_minutes is not null then
    v_time_taken := least(v_time_taken, target_attempt.duration_minutes * 60);
  end if;

  update public.test_attempts attempt
  set
    score = v_score,
    total_marks = v_total_marks,
    total_questions = v_total_questions,
    correct_answers = v_correct,
    wrong_answers = v_wrong,
    skipped = v_skipped,
    time_taken_seconds = v_time_taken,
    status = 'completed',
    completed_at = now()
  where attempt.id = p_attempt_id;

  if target_attempt.source_type <> 'test' then
    insert into public.syllabus_progress (user_id, topic_id, is_completed, completed_at)
    select target_attempt.user_id, question.topic_id, true, now()
    from public.user_answers answer
    join public.questions question on question.id = answer.question_id
    where answer.attempt_id = p_attempt_id
    group by question.topic_id
    on conflict (user_id, topic_id) do update set
      is_completed = true,
      completed_at = excluded.completed_at;
  end if;

  if target_attempt.test_id is not null then
    select coalesce(test.exam_id, profile.exam_id)
    into v_exam_id
    from public.profiles profile
    left join public.tests test on test.id = target_attempt.test_id
    where profile.id = target_attempt.user_id;

    if v_exam_id is not null then
      insert into public.leaderboard_scores (
        exam_id,
        user_id,
        total_score,
        tests_taken,
        total_correct,
        total_questions
      )
      values (
        v_exam_id,
        target_attempt.user_id,
        v_score,
        1,
        v_correct,
        v_total_questions
      )
      on conflict (exam_id, user_id) do update set
        total_score = public.leaderboard_scores.total_score + excluded.total_score,
        tests_taken = public.leaderboard_scores.tests_taken + 1,
        total_correct = public.leaderboard_scores.total_correct + excluded.total_correct,
        total_questions = public.leaderboard_scores.total_questions + excluded.total_questions,
        updated_at = now();
    end if;
  end if;

  score := v_score;
  correct_answers := v_correct;
  wrong_answers := v_wrong;
  skipped := v_skipped;
  total_questions := v_total_questions;
  total_marks := v_total_marks;
  time_taken_seconds := v_time_taken;
  return next;
end;
$$;

revoke all on function public.submit_attempt(uuid, jsonb) from public;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;

create or replace function public.get_leaderboard_rank(
  p_exam_id uuid,
  p_user_id uuid default null
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_user_id uuid := coalesce(p_user_id, auth.uid());
  target_score public.leaderboard_scores%rowtype;
  better_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'You cannot read this leaderboard rank.';
  end if;

  select *
  into target_score
  from public.leaderboard_scores
  where exam_id = p_exam_id
    and user_id = target_user_id;

  if not found then
    return null;
  end if;

  select count(*)::integer
  into better_count
  from public.leaderboard_scores score
  where score.exam_id = p_exam_id
    and (
      score.total_score > target_score.total_score
      or (
        score.total_score = target_score.total_score
        and score.updated_at < target_score.updated_at
      )
    );

  return coalesce(better_count, 0) + 1;
end;
$$;

revoke all on function public.get_leaderboard_rank(uuid, uuid) from public;
grant execute on function public.get_leaderboard_rank(uuid, uuid) to authenticated;

revoke all on function public.record_leaderboard_attempt(uuid, uuid, integer, integer, integer) from public;
revoke all on function public.record_leaderboard_attempt(uuid, uuid, integer, integer, integer) from authenticated;

drop policy if exists "Users manage own attempts" on public.test_attempts;
drop policy if exists "Users read own attempts" on public.test_attempts;
create policy "Users read own attempts" on public.test_attempts
for select using (auth.uid() = user_id);

drop policy if exists "Users manage own answers" on public.user_answers;
drop policy if exists "Users read own answers" on public.user_answers;
create policy "Users read own answers" on public.user_answers
for select using (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = user_answers.attempt_id
      and test_attempts.user_id = auth.uid()
  )
);

drop policy if exists "Users update in-progress answers" on public.user_answers;
create policy "Users update in-progress answers" on public.user_answers
for update using (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = user_answers.attempt_id
      and test_attempts.user_id = auth.uid()
      and test_attempts.status = 'in_progress'
  )
) with check (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = user_answers.attempt_id
      and test_attempts.user_id = auth.uid()
      and test_attempts.status = 'in_progress'
  )
);

drop policy if exists "Read leaderboard" on public.leaderboard_scores;
create policy "Authenticated users read leaderboard" on public.leaderboard_scores
for select using (auth.uid() is not null);

drop policy if exists "Users manage own leaderboard" on public.leaderboard_scores;
