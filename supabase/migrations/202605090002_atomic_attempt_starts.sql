create index if not exists idx_test_attempts_user_test_status
on public.test_attempts(user_id, test_id, status)
where test_id is not null;

create or replace function public.start_test_attempt(p_test_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  target_test public.tests%rowtype;
  question_ids uuid[];
  new_attempt_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  select * into target_test
  from public.tests
  where id = p_test_id
    and status = 'active'
    and (scheduled_at is null or now() >= scheduled_at)
    and (scheduled_end_at is null or now() <= scheduled_end_at)
    and (
      is_global = true
      or (exam_id is not null and exam_id = current_profile.exam_id)
    )
  for update;

  if not found then
    raise exception 'This test is not available.';
  end if;

  if not target_test.allow_multiple_attempts and exists (
    select 1
    from public.test_attempts
    where user_id = auth.uid()
      and test_id = target_test.id
      and status = 'completed'
  ) then
    raise exception 'You have already completed this test.';
  end if;

  select array_agg(question_id order by sort_order)
  into question_ids
  from public.test_questions
  where test_id = target_test.id;

  if coalesce(array_length(question_ids, 1), 0) = 0 then
    raise exception 'This test does not have questions assigned yet.';
  end if;

  if target_test.shuffle_questions then
    select array_agg(question_id order by sort_key)
    into question_ids
    from (
      select unnest(question_ids) as question_id, random() as sort_key
    ) shuffled;
  end if;

  insert into public.test_attempts (
    user_id,
    test_id,
    source_type,
    source_id,
    source_name,
    total_questions,
    total_marks,
    duration_minutes,
    status
  )
  values (
    auth.uid(),
    target_test.id,
    'test',
    target_test.id,
    target_test.title,
    array_length(question_ids, 1),
    target_test.total_marks,
    target_test.duration_minutes,
    'in_progress'
  )
  returning id into new_attempt_id;

  insert into public.user_answers (attempt_id, question_id, time_spent_seconds)
  select new_attempt_id, question_id, 0
  from unnest(question_ids) as question_id;

  return new_attempt_id;
end;
$$;

create or replace function public.start_practice_attempt(
  p_source_type text,
  p_source_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  source_name text;
  source_exam_id uuid;
  question_ids uuid[];
  question_count integer;
  total_marks integer;
  new_attempt_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if current_profile.exam_id is null then
    raise exception 'Select an exam before starting practice.';
  end if;

  if p_source_type = 'topic' then
    select topic.name, subject.exam_id
    into source_name, source_exam_id
    from public.topics topic
    join public.chapters chapter on chapter.id = topic.chapter_id
    join public.subjects subject on subject.id = chapter.subject_id
    where topic.id = p_source_id;

    select array_agg(id), coalesce(sum(marks), 0)
    into question_ids, total_marks
    from (
      select question.id, question.marks
      from public.questions question
      where question.topic_id = p_source_id
        and question.is_active = true
      order by question.created_at desc
      limit 20
    ) picked;
  elsif p_source_type = 'chapter' then
    select chapter.name, subject.exam_id
    into source_name, source_exam_id
    from public.chapters chapter
    join public.subjects subject on subject.id = chapter.subject_id
    where chapter.id = p_source_id;

    select array_agg(id), coalesce(sum(marks), 0)
    into question_ids, total_marks
    from (
      select question.id, question.marks
      from public.questions question
      join public.topics topic on topic.id = question.topic_id
      where topic.chapter_id = p_source_id
        and question.is_active = true
      order by question.created_at desc
      limit 20
    ) picked;
  elsif p_source_type = 'subject' then
    select subject.name, subject.exam_id
    into source_name, source_exam_id
    from public.subjects subject
    where subject.id = p_source_id;

    select array_agg(id), coalesce(sum(marks), 0)
    into question_ids, total_marks
    from (
      select question.id, question.marks
      from public.questions question
      join public.topics topic on topic.id = question.topic_id
      join public.chapters chapter on chapter.id = topic.chapter_id
      where chapter.subject_id = p_source_id
        and question.is_active = true
      order by question.created_at desc
      limit 20
    ) picked;
  else
    raise exception 'Unsupported practice source type.';
  end if;

  if source_name is null then
    raise exception 'Practice source not found.';
  end if;

  if source_exam_id <> current_profile.exam_id then
    raise exception 'This practice content is not available for your exam.';
  end if;

  question_count := coalesce(array_length(question_ids, 1), 0);
  if question_count = 0 then
    raise exception 'No active questions found for this selection yet.';
  end if;

  insert into public.test_attempts (
    user_id,
    source_type,
    source_id,
    source_name,
    total_questions,
    total_marks,
    duration_minutes,
    status
  )
  values (
    auth.uid(),
    p_source_type::public.attempt_source_enum,
    p_source_id,
    source_name,
    question_count,
    coalesce(total_marks, 0),
    greatest(question_count * 2, 10),
    'in_progress'
  )
  returning id into new_attempt_id;

  insert into public.user_answers (attempt_id, question_id, time_spent_seconds)
  select new_attempt_id, question_id, 0
  from unnest(question_ids) as question_id;

  return new_attempt_id;
end;
$$;

revoke all on function public.start_test_attempt(uuid) from public;
grant execute on function public.start_test_attempt(uuid) to authenticated;

revoke all on function public.start_practice_attempt(text, uuid) from public;
grant execute on function public.start_practice_attempt(text, uuid) to authenticated;
