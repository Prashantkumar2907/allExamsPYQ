import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dbPath = join(root, 'local', 'demo.sqlite');

mkdirSync(dirname(dbPath), { recursive: true });
rmSync(dbPath, { force: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  create table exams (
    id text primary key,
    name text not null unique,
    description text,
    is_active integer not null default 1
  );

  create table subjects (
    id text primary key,
    exam_id text not null references exams(id) on delete cascade,
    name text not null,
    description text,
    sort_order integer not null default 0
  );

  create table chapters (
    id text primary key,
    subject_id text not null references subjects(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0
  );

  create table topics (
    id text primary key,
    chapter_id text not null references chapters(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0
  );

  create table questions (
    id text primary key,
    topic_id text not null references topics(id) on delete restrict,
    question_text text not null,
    question_type text not null default 'single_choice',
    difficulty text not null default 'medium',
    marks integer not null default 4,
    negative_marks integer not null default 1,
    explanation text,
    year integer,
    is_active integer not null default 1
  );

  create table options (
    id text primary key,
    question_id text not null references questions(id) on delete cascade,
    option_text text not null,
    is_correct integer not null default 0,
    explanation text,
    sort_order integer not null default 0
  );

  create table users (
    id text primary key,
    email text not null unique,
    password text not null,
    full_name text not null,
    role text not null default 'student',
    exam_id text references exams(id) on delete set null
  );

  create table tests (
    id text primary key,
    title text not null,
    description text,
    exam_id text references exams(id) on delete set null,
    is_global integer not null default 0,
    duration_minutes integer not null default 60,
    total_marks integer not null default 100,
    shuffle_questions integer not null default 1,
    allow_multiple_attempts integer not null default 0,
    instructions text,
    status text not null default 'draft'
  );

  create table test_questions (
    test_id text not null references tests(id) on delete cascade,
    question_id text not null references questions(id) on delete restrict,
    sort_order integer not null default 0,
    primary key (test_id, question_id)
  );
`);

const insert = (sql, rows) => {
  const stmt = db.prepare(sql);
  for (const row of rows) stmt.run(...row);
};

insert('insert into exams values (?, ?, ?, ?)', [
  ['jee-main', 'JEE Main', 'Engineering entrance exam practice set', 1],
  ['neet-ug', 'NEET UG', 'Medical entrance exam practice set', 1],
]);

insert('insert into subjects values (?, ?, ?, ?, ?)', [
  ['physics', 'jee-main', 'Physics', 'Mechanics, electricity, and modern physics', 1],
  ['mathematics', 'jee-main', 'Mathematics', 'Algebra, calculus, coordinate geometry', 2],
  ['biology', 'neet-ug', 'Biology', 'Botany and zoology PYQs', 1],
]);

insert('insert into chapters values (?, ?, ?, ?)', [
  ['mechanics', 'physics', 'Mechanics', 1],
  ['calculus', 'mathematics', 'Calculus', 1],
  ['human-physiology', 'biology', 'Human Physiology', 1],
]);

insert('insert into topics values (?, ?, ?, ?)', [
  ['newton-laws', 'mechanics', 'Newton Laws', 1],
  ['work-energy', 'mechanics', 'Work and Energy', 2],
  ['limits', 'calculus', 'Limits', 1],
  ['circulation', 'human-physiology', 'Circulation', 1],
]);

insert('insert into questions values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
  ['q-force-acceleration', 'newton-laws', 'A force of 10 N acts on a 2 kg body. What is the acceleration?', 'single_choice', 'easy', 4, 1, 'Use F = ma, so a = 10 / 2.', 2024, 1],
  ['q-recoil', 'newton-laws', 'Which law explains the recoil of a gun?', 'single_choice', 'medium', 4, 1, 'Gun recoil follows equal and opposite forces.', 2023, 1],
  ['q-ke-speed', 'work-energy', 'If kinetic energy doubles while mass stays constant, speed changes by what factor?', 'single_choice', 'medium', 4, 1, 'Kinetic energy is proportional to v squared.', 2022, 1],
  ['q-limit', 'limits', 'lim x->0 sin(x)/x equals?', 'single_choice', 'easy', 4, 1, 'This standard limit equals one.', 2024, 1],
]);

insert('insert into options values (?, ?, ?, ?, ?, ?)', [
  ['o-force-a', 'q-force-acceleration', '2 m/s^2', 0, 'This would need a smaller force.', 1],
  ['o-force-b', 'q-force-acceleration', '5 m/s^2', 1, '10 / 2 = 5.', 2],
  ['o-force-c', 'q-force-acceleration', '10 m/s^2', 0, 'This ignores mass.', 3],
  ['o-force-d', 'q-force-acceleration', '20 m/s^2', 0, 'This multiplies force and mass.', 4],
  ['o-recoil-a', 'q-recoil', 'Newton first law', 0, 'First law explains inertia.', 1],
  ['o-recoil-b', 'q-recoil', 'Newton third law', 1, 'Equal and opposite forces explain recoil.', 2],
  ['o-recoil-c', 'q-recoil', 'Law of gravitation', 0, 'Gravity is not the primary cause.', 3],
  ['o-recoil-d', 'q-recoil', 'Ohm law', 0, 'This belongs to electricity.', 4],
  ['o-ke-a', 'q-ke-speed', '2', 0, 'That would be linear dependence.', 1],
  ['o-ke-b', 'q-ke-speed', 'sqrt(2)', 1, 'Speed scales with the square root.', 2],
  ['o-ke-c', 'q-ke-speed', '4', 0, 'Too high.', 3],
  ['o-ke-d', 'q-ke-speed', '1/2', 0, 'The speed increases.', 4],
  ['o-limit-a', 'q-limit', '0', 0, 'The ratio does not tend to zero.', 1],
  ['o-limit-b', 'q-limit', '1', 1, 'Correct standard limit.', 2],
  ['o-limit-c', 'q-limit', 'infinity', 0, 'The expression has a finite limit.', 3],
  ['o-limit-d', 'q-limit', '-1', 0, 'The limit is positive.', 4],
]);

insert('insert into users values (?, ?, ?, ?, ?, ?)', [
  ['demo-student', 'demoaccount@allexamspyq.local', 'Demo@12345', 'Demo Student', 'student', 'jee-main'],
  ['demo-admin', 'admin@allexamspyq.local', 'Admin@12345', 'Demo Admin', 'admin', null],
]);

insert('insert into tests values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
  ['jee-demo-mechanics', 'JEE Demo Mechanics Sprint', 'A short local demo test.', 'jee-main', 0, 15, 12, 0, 1, 'Answer all questions.', 'active'],
  ['global-pyq-warmup', 'Global PYQ Warmup', 'A short global practice test.', null, 1, 10, 8, 0, 1, 'Warm up with mixed questions.', 'active'],
]);

insert('insert into test_questions values (?, ?, ?)', [
  ['jee-demo-mechanics', 'q-force-acceleration', 1],
  ['jee-demo-mechanics', 'q-recoil', 2],
  ['jee-demo-mechanics', 'q-ke-speed', 3],
  ['global-pyq-warmup', 'q-force-acceleration', 1],
  ['global-pyq-warmup', 'q-limit', 2],
]);

const counts = db.prepare(`
  select
    (select count(*) from exams) as exams,
    (select count(*) from questions) as questions,
    (select count(*) from tests) as tests,
    (select count(*) from users) as users
`).get();

db.close();

console.log(`Created ${dbPath}`);
console.log(JSON.stringify(counts, null, 2));

