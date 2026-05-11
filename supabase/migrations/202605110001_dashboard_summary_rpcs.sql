create or replace function public.count_exam_topics(p_exam_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  topic_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (role = 'admin' or exam_id = p_exam_id)
  ) then
    raise exception 'Not authorized to read topic count';
  end if;

  select count(*)
  into topic_count
  from public.topics t
  join public.chapters c on c.id = t.chapter_id
  join public.subjects s on s.id = c.subject_id
  where s.exam_id = p_exam_id;

  return coalesce(topic_count, 0);
end;
$$;

create or replace function public.get_admin_dashboard_summary(
  p_days integer default 7,
  p_recent_limit integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_days integer := least(greatest(coalesce(p_days, 7), 1), 30);
  safe_recent_limit integer := least(greatest(coalesce(p_recent_limit, 5), 1), 25);
  start_date date;
  summary jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can read admin dashboard summary';
  end if;

  start_date := current_date - (safe_days - 1);

  with day_series as (
    select generate_series(start_date, current_date, interval '1 day')::date as day
  ),
  daily_counts as (
    select completed_at::date as day, count(*)::integer as count
    from public.test_attempts
    where status = 'completed'
      and completed_at >= start_date
      and completed_at < current_date + interval '1 day'
    group by completed_at::date
  ),
  difficulty_counts as (
    select d.name::text as name, count(q.id)::integer as count
    from (values
      ('easy'::public.difficulty_enum),
      ('medium'::public.difficulty_enum),
      ('hard'::public.difficulty_enum)
    ) as d(name)
    left join public.questions q on q.difficulty = d.name
    group by d.name
    having count(q.id) > 0
  ),
  recent_attempts as (
    select
      ta.id,
      ta.source_name,
      ta.score,
      ta.total_marks,
      ta.completed_at,
      p.full_name
    from public.test_attempts ta
    left join public.profiles p on p.id = ta.user_id
    where ta.status = 'completed'
    order by ta.completed_at desc nulls last
    limit safe_recent_limit
  )
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'exams', (select count(*) from public.exams),
      'questions', (select count(*) from public.questions),
      'tests', (select count(*) from public.tests),
      'attempts', (select count(*) from public.test_attempts)
    ),
    'reported_count', (
      select count(*) from public.reported_questions where status = 'pending'
    ),
    'difficulty_data', (
      select coalesce(
        jsonb_agg(jsonb_build_object('name', name, 'count', count) order by name),
        '[]'::jsonb
      )
      from difficulty_counts
    ),
    'daily_attempts', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', to_char(ds.day, 'YYYY-MM-DD'),
            'label', to_char(ds.day, 'Dy'),
            'count', coalesce(dc.count, 0)
          )
          order by ds.day
        ),
        '[]'::jsonb
      )
      from day_series ds
      left join daily_counts dc on dc.day = ds.day
    ),
    'recent_attempts', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'source_name', source_name,
            'score', score,
            'total_marks', total_marks,
            'completed_at', completed_at,
            'profile', jsonb_build_object('full_name', full_name)
          )
          order by completed_at desc nulls last
        ),
        '[]'::jsonb
      )
      from recent_attempts
    )
  )
  into summary;

  return summary;
end;
$$;

revoke all on function public.count_exam_topics(uuid) from public;
grant execute on function public.count_exam_topics(uuid) to authenticated;

revoke all on function public.get_admin_dashboard_summary(integer, integer) from public;
grant execute on function public.get_admin_dashboard_summary(integer, integer) to authenticated;
