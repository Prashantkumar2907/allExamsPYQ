-- Demo data for local Supabase development.
-- Run: supabase db reset

insert into public.exams (id, name, description, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'JEE Main', 'Engineering entrance exam practice set', true),
  ('22222222-2222-2222-2222-222222222222', 'NEET UG', 'Medical entrance exam practice set', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.subjects (id, exam_id, name, description, sort_order)
values
  ('11111111-aaaa-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Physics', 'Mechanics, electricity, and modern physics', 1),
  ('11111111-bbbb-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Mathematics', 'Algebra, calculus, coordinate geometry', 2),
  ('22222222-aaaa-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Biology', 'Botany and zoology core PYQs', 1)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.chapters (id, subject_id, name, sort_order)
values
  ('11111111-0001-aaaa-1111-111111111111', '11111111-aaaa-1111-1111-111111111111', 'Mechanics', 1),
  ('11111111-0002-bbbb-1111-111111111111', '11111111-bbbb-1111-1111-111111111111', 'Calculus', 1),
  ('22222222-0001-aaaa-2222-222222222222', '22222222-aaaa-2222-2222-222222222222', 'Human Physiology', 1)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.topics (id, chapter_id, name, sort_order)
values
  ('11111111-0001-0001-aaaa-111111111111', '11111111-0001-aaaa-1111-111111111111', 'Newton Laws', 1),
  ('11111111-0001-0002-aaaa-111111111111', '11111111-0001-aaaa-1111-111111111111', 'Work and Energy', 2),
  ('11111111-0002-0001-bbbb-111111111111', '11111111-0002-bbbb-1111-111111111111', 'Limits', 1),
  ('22222222-0001-0001-aaaa-222222222222', '22222222-0001-aaaa-2222-222222222222', 'Circulation', 1)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.questions (id, topic_id, question_text, question_type, difficulty, marks, negative_marks, explanation, year, is_active)
values
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '11111111-0001-0001-aaaa-111111111111', 'A force of 10 N acts on a 2 kg body. What is the acceleration?', 'single_choice', 'easy', 4, 1, 'Use Newton''s second law F = ma, so a = F / m = 10 / 2.', 2024, true),
  ('aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', '11111111-0001-0001-aaaa-111111111111', 'Which law explains the recoil of a gun?', 'single_choice', 'medium', 4, 1, 'Gun recoil follows conservation of momentum and Newton''s third law.', 2023, true),
  ('aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', '11111111-0001-0002-aaaa-111111111111', 'If kinetic energy doubles while mass stays constant, speed changes by what factor?', 'single_choice', 'medium', 4, 1, 'K = 1/2 mv^2, so speed scales with the square root of kinetic energy.', 2022, true),
  ('bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', '11111111-0002-0001-bbbb-111111111111', 'lim x->0 sin(x)/x equals?', 'single_choice', 'easy', 4, 1, 'This is the standard trigonometric limit.', 2024, true),
  ('cccccccc-0001-0001-0001-cccccccccccc', '22222222-0001-0001-aaaa-222222222222', 'Which chamber of the human heart pumps oxygenated blood to the body?', 'single_choice', 'easy', 4, 1, 'The left ventricle pumps oxygenated blood into the aorta.', 2023, true)
on conflict (id) do update set
  question_text = excluded.question_text,
  difficulty = excluded.difficulty,
  marks = excluded.marks,
  negative_marks = excluded.negative_marks,
  explanation = excluded.explanation,
  year = excluded.year,
  is_active = excluded.is_active;

insert into public.options (id, question_id, option_text, is_correct, explanation, sort_order)
values
  ('90000000-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2 m/s^2', false, 'This would be correct if the force were 4 N.', 1),
  ('90000000-0001-0001-0001-000000000002', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '5 m/s^2', true, 'a = F / m = 10 / 2 = 5.', 2),
  ('90000000-0001-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '10 m/s^2', false, 'This ignores the body mass.', 3),
  ('90000000-0001-0001-0001-000000000004', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '20 m/s^2', false, 'This multiplies force and mass instead of dividing.', 4),

  ('90000000-0001-0001-0002-000000000001', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 'Newton''s first law', false, 'First law explains inertia, not recoil.', 1),
  ('90000000-0001-0001-0002-000000000002', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 'Newton''s second law', false, 'Second law relates force, mass, and acceleration.', 2),
  ('90000000-0001-0001-0002-000000000003', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 'Newton''s third law', true, 'The gun and bullet exert equal and opposite forces.', 3),
  ('90000000-0001-0001-0002-000000000004', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 'Law of gravitation', false, 'Gravity is not the main explanation of recoil.', 4),

  ('90000000-0001-0002-0001-000000000001', 'aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', '2', false, 'That would apply if kinetic energy were proportional to speed.', 1),
  ('90000000-0001-0002-0001-000000000002', 'aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', 'sqrt(2)', true, 'Speed changes by the square root of the kinetic energy factor.', 2),
  ('90000000-0001-0002-0001-000000000003', 'aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', '4', false, 'This overstates the effect.', 3),
  ('90000000-0001-0002-0001-000000000004', 'aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', '1/2', false, 'Doubling kinetic energy increases speed, not decreases it.', 4),

  ('90000000-0002-0001-0001-000000000001', 'bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', '0', false, 'The ratio tends to one, not zero.', 1),
  ('90000000-0002-0001-0001-000000000002', 'bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', '1', true, 'This standard limit equals one.', 2),
  ('90000000-0002-0001-0001-000000000003', 'bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', 'infinity', false, 'The numerator and denominator both approach zero proportionally.', 3),
  ('90000000-0002-0001-0001-000000000004', 'bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', '-1', false, 'The two-sided limit is positive one.', 4),

  ('90000000-0003-0001-0001-000000000001', 'cccccccc-0001-0001-0001-cccccccccccc', 'Right atrium', false, 'The right atrium receives deoxygenated blood.', 1),
  ('90000000-0003-0001-0001-000000000002', 'cccccccc-0001-0001-0001-cccccccccccc', 'Right ventricle', false, 'The right ventricle pumps blood to the lungs.', 2),
  ('90000000-0003-0001-0001-000000000003', 'cccccccc-0001-0001-0001-cccccccccccc', 'Left atrium', false, 'The left atrium receives oxygenated blood from pulmonary veins.', 3),
  ('90000000-0003-0001-0001-000000000004', 'cccccccc-0001-0001-0001-cccccccccccc', 'Left ventricle', true, 'The left ventricle pumps oxygenated blood to systemic circulation.', 4)
on conflict (id) do update set
  option_text = excluded.option_text,
  is_correct = excluded.is_correct,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order;

insert into public.tests (id, title, description, exam_id, is_global, duration_minutes, total_marks, shuffle_questions, allow_multiple_attempts, instructions, status)
values
  ('dddddddd-0001-0001-0001-dddddddddddd', 'JEE Demo Mechanics Sprint', 'A short local demo test for the seeded demo account.', '11111111-1111-1111-1111-111111111111', false, 15, 12, false, true, 'Answer all questions. Review explanations after submission.', 'active'),
  ('dddddddd-0002-0001-0001-dddddddddddd', 'Global PYQ Warmup', 'A short test available to every student.', null, true, 10, 8, false, true, 'This is a quick warmup test.', 'active')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  exam_id = excluded.exam_id,
  is_global = excluded.is_global,
  duration_minutes = excluded.duration_minutes,
  total_marks = excluded.total_marks,
  shuffle_questions = excluded.shuffle_questions,
  allow_multiple_attempts = excluded.allow_multiple_attempts,
  instructions = excluded.instructions,
  status = excluded.status;

insert into public.test_questions (test_id, question_id, sort_order)
values
  ('dddddddd-0001-0001-0001-dddddddddddd', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', 1),
  ('dddddddd-0001-0001-0001-dddddddddddd', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 2),
  ('dddddddd-0001-0001-0001-dddddddddddd', 'aaaaaaaa-0001-0002-0001-aaaaaaaaaaaa', 3),
  ('dddddddd-0002-0001-0001-dddddddddddd', 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', 1),
  ('dddddddd-0002-0001-0001-dddddddddddd', 'bbbbbbbb-0002-0001-0001-bbbbbbbbbbbb', 2)
on conflict (test_id, question_id) do update set sort_order = excluded.sort_order;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demoaccount@allexamspyq.local',
    crypt('Demo@12345', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Demo Student","exam_id":"11111111-1111-1111-1111-111111111111","role":"student"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@allexamspyq.local',
    crypt('Admin@12345', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Demo Admin","role":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1","email":"demoaccount@allexamspyq.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2","email":"admin@allexamspyq.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

update public.profiles
set
  full_name = 'Demo Student',
  role = 'student',
  exam_id = '11111111-1111-1111-1111-111111111111',
  avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=Demo%20Student',
  bio = 'Seeded local account for end-to-end testing.'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

update public.profiles
set
  full_name = 'Demo Admin',
  role = 'admin',
  avatar_url = 'https://api.dicebear.com/9.x/micah/svg?seed=Demo%20Admin',
  bio = 'Seeded local admin account for content management testing.'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';

insert into public.bookmarks (user_id, question_id, notes)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-0001-0001-0002-aaaaaaaaaaaa', 'Review recoil and momentum conservation again.')
on conflict (user_id, question_id) do update set notes = excluded.notes;

