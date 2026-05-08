import type {
  Bookmark,
  Chapter,
  Exam,
  LeaderboardScore,
  Option,
  Profile,
  Question,
  ReportedQuestion,
  Subject,
  SyllabusProgress,
  Test,
  TestAttempt,
  TestQuestion,
  Topic,
  UserAnswer,
} from '../types/database';

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  profile_id: string;
}

export interface DemoState {
  demo_users: DemoUser[];
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  questions: Question[];
  options: Option[];
  profiles: Profile[];
  tests: Test[];
  test_questions: Array<TestQuestion & { id: string }>;
  test_attempts: TestAttempt[];
  user_answers: UserAnswer[];
  bookmarks: Bookmark[];
  leaderboard_scores: LeaderboardScore[];
  reported_questions: ReportedQuestion[];
  syllabus_progress: SyllabusProgress[];
}

const now = new Date('2026-05-08T08:00:00.000Z').toISOString();
const yesterday = new Date('2026-05-07T08:00:00.000Z').toISOString();
const twoDaysAgo = new Date('2026-05-06T08:00:00.000Z').toISOString();

export function createDemoState(): DemoState {
  const exams: Exam[] = [
    {
      id: 'jee-main',
      name: 'JEE Main',
      description: 'Engineering entrance exam practice set',
      is_active: true,
      created_at: now,
    },
    {
      id: 'neet-ug',
      name: 'NEET UG',
      description: 'Medical entrance exam practice set',
      is_active: true,
      created_at: now,
    },
  ];

  const subjects: Subject[] = [
    {
      id: 'physics',
      exam_id: 'jee-main',
      name: 'Physics',
      description: 'Mechanics, electricity, and modern physics',
      sort_order: 1,
      created_at: now,
    },
    {
      id: 'mathematics',
      exam_id: 'jee-main',
      name: 'Mathematics',
      description: 'Algebra, calculus, coordinate geometry',
      sort_order: 2,
      created_at: now,
    },
    {
      id: 'biology',
      exam_id: 'neet-ug',
      name: 'Biology',
      description: 'Botany and zoology PYQs',
      sort_order: 1,
      created_at: now,
    },
  ];

  const chapters: Chapter[] = [
    { id: 'mechanics', subject_id: 'physics', name: 'Mechanics', sort_order: 1, created_at: now },
    { id: 'calculus', subject_id: 'mathematics', name: 'Calculus', sort_order: 1, created_at: now },
    { id: 'human-physiology', subject_id: 'biology', name: 'Human Physiology', sort_order: 1, created_at: now },
  ];

  const topics: Topic[] = [
    { id: 'newton-laws', chapter_id: 'mechanics', name: 'Newton Laws', sort_order: 1, created_at: now },
    { id: 'work-energy', chapter_id: 'mechanics', name: 'Work and Energy', sort_order: 2, created_at: now },
    { id: 'limits', chapter_id: 'calculus', name: 'Limits', sort_order: 1, created_at: now },
    { id: 'circulation', chapter_id: 'human-physiology', name: 'Circulation', sort_order: 1, created_at: now },
  ];

  const questions: Question[] = [
    {
      id: 'q-force-acceleration',
      topic_id: 'newton-laws',
      question_text: 'A force of 10 N acts on a 2 kg body. What is the acceleration?',
      question_type: 'single_choice',
      difficulty: 'easy',
      marks: 4,
      negative_marks: 1,
      explanation: 'Use F = ma, so a = 10 / 2.',
      year: 2024,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'q-recoil',
      topic_id: 'newton-laws',
      question_text: 'Which law explains the recoil of a gun?',
      question_type: 'single_choice',
      difficulty: 'medium',
      marks: 4,
      negative_marks: 1,
      explanation: 'Gun recoil follows equal and opposite forces.',
      year: 2023,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'q-ke-speed',
      topic_id: 'work-energy',
      question_text: 'If kinetic energy doubles while mass stays constant, speed changes by what factor?',
      question_type: 'single_choice',
      difficulty: 'medium',
      marks: 4,
      negative_marks: 1,
      explanation: 'Kinetic energy is proportional to v squared.',
      year: 2022,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'q-limit',
      topic_id: 'limits',
      question_text: 'lim x->0 sin(x)/x equals?',
      question_type: 'single_choice',
      difficulty: 'easy',
      marks: 4,
      negative_marks: 1,
      explanation: 'This standard limit equals one.',
      year: 2024,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const options: Option[] = [
    ['q-force-acceleration', '2 m/s^2', false, 'This would need a smaller force.'],
    ['q-force-acceleration', '5 m/s^2', true, '10 / 2 = 5.'],
    ['q-force-acceleration', '10 m/s^2', false, 'This ignores mass.'],
    ['q-force-acceleration', '20 m/s^2', false, 'This multiplies force and mass.'],
    ['q-recoil', 'Newton first law', false, 'First law explains inertia.'],
    ['q-recoil', 'Newton third law', true, 'Equal and opposite forces explain recoil.'],
    ['q-recoil', 'Law of gravitation', false, 'Gravity is not the primary cause.'],
    ['q-recoil', 'Ohm law', false, 'This belongs to electricity.'],
    ['q-ke-speed', '2', false, 'That would be linear dependence.'],
    ['q-ke-speed', 'sqrt(2)', true, 'Speed scales with the square root.'],
    ['q-ke-speed', '4', false, 'Too high.'],
    ['q-ke-speed', '1/2', false, 'The speed increases.'],
    ['q-limit', '0', false, 'The ratio does not tend to zero.'],
    ['q-limit', '1', true, 'Correct standard limit.'],
    ['q-limit', 'infinity', false, 'The expression has a finite limit.'],
    ['q-limit', '-1', false, 'The limit is positive.'],
  ].map(([questionId, text, correct, explanation], index) => ({
    id: `option-${index + 1}`,
    question_id: questionId as string,
    option_text: text as string,
    is_correct: correct as boolean,
    explanation: explanation as string,
    sort_order: (index % 4) + 1,
  }));

  const profiles: Profile[] = [
    {
      id: 'demo-student',
      full_name: 'Demo Student',
      email: 'demoaccount@allexamspyq.local',
      phone: null,
      avatar_url: null,
      role: 'student',
      exam_id: 'jee-main',
      bio: 'Focused on JEE Main PYQ practice.',
      created_at: twoDaysAgo,
      updated_at: now,
      exam: exams[0],
    },
    {
      id: 'demo-admin',
      full_name: 'Demo Admin',
      email: 'admin@allexamspyq.local',
      phone: null,
      avatar_url: null,
      role: 'admin',
      exam_id: null,
      bio: 'Maintains content and test quality.',
      created_at: twoDaysAgo,
      updated_at: now,
      exam: null,
    },
  ];

  const tests: Test[] = [
    {
      id: 'jee-demo-mechanics',
      title: 'JEE Demo Mechanics Sprint',
      description: 'A short local demo test.',
      exam_id: 'jee-main',
      is_global: false,
      duration_minutes: 15,
      total_marks: 12,
      shuffle_questions: false,
      allow_multiple_attempts: true,
      instructions: 'Answer all questions.',
      status: 'active',
      scheduled_at: null,
      scheduled_end_at: null,
      created_at: now,
      updated_at: now,
      exam: exams[0],
    },
    {
      id: 'global-pyq-warmup',
      title: 'Global PYQ Warmup',
      description: 'A short global practice test.',
      exam_id: null,
      is_global: true,
      duration_minutes: 10,
      total_marks: 8,
      shuffle_questions: false,
      allow_multiple_attempts: true,
      instructions: 'Warm up with mixed questions.',
      status: 'active',
      scheduled_at: null,
      scheduled_end_at: null,
      created_at: now,
      updated_at: now,
      exam: null,
    },
  ];

  const testQuestions: Array<TestQuestion & { id: string }> = [
    { id: 'tq-1', test_id: 'jee-demo-mechanics', question_id: 'q-force-acceleration', sort_order: 1 },
    { id: 'tq-2', test_id: 'jee-demo-mechanics', question_id: 'q-recoil', sort_order: 2 },
    { id: 'tq-3', test_id: 'jee-demo-mechanics', question_id: 'q-ke-speed', sort_order: 3 },
    { id: 'tq-4', test_id: 'global-pyq-warmup', question_id: 'q-force-acceleration', sort_order: 1 },
    { id: 'tq-5', test_id: 'global-pyq-warmup', question_id: 'q-limit', sort_order: 2 },
  ];

  const testAttempts: TestAttempt[] = [
    {
      id: 'attempt-demo-completed-1',
      user_id: 'demo-student',
      test_id: 'jee-demo-mechanics',
      source_type: 'test',
      source_id: 'jee-demo-mechanics',
      source_name: 'JEE Demo Mechanics Sprint',
      score: 7,
      total_marks: 12,
      total_questions: 3,
      correct_answers: 2,
      wrong_answers: 1,
      skipped: 0,
      time_taken_seconds: 420,
      duration_minutes: 15,
      status: 'completed',
      started_at: yesterday,
      completed_at: yesterday,
    },
    {
      id: 'attempt-demo-completed-2',
      user_id: 'demo-student',
      test_id: null,
      source_type: 'topic',
      source_id: 'limits',
      source_name: 'Limits',
      score: 4,
      total_marks: 4,
      total_questions: 1,
      correct_answers: 1,
      wrong_answers: 0,
      skipped: 0,
      time_taken_seconds: 90,
      duration_minutes: 10,
      status: 'completed',
      started_at: twoDaysAgo,
      completed_at: twoDaysAgo,
    },
  ];

  const userAnswers: UserAnswer[] = [
    {
      id: 'ua-demo-1',
      attempt_id: 'attempt-demo-completed-1',
      question_id: 'q-force-acceleration',
      selected_option_id: 'option-2',
      is_correct: true,
      time_spent_seconds: 120,
    },
    {
      id: 'ua-demo-2',
      attempt_id: 'attempt-demo-completed-1',
      question_id: 'q-recoil',
      selected_option_id: 'option-5',
      is_correct: false,
      time_spent_seconds: 150,
    },
    {
      id: 'ua-demo-3',
      attempt_id: 'attempt-demo-completed-1',
      question_id: 'q-ke-speed',
      selected_option_id: 'option-10',
      is_correct: true,
      time_spent_seconds: 150,
    },
    {
      id: 'ua-demo-4',
      attempt_id: 'attempt-demo-completed-2',
      question_id: 'q-limit',
      selected_option_id: 'option-14',
      is_correct: true,
      time_spent_seconds: 90,
    },
  ];

  return {
    demo_users: [
      {
        id: 'demo-student-user',
        email: 'demoaccount@allexamspyq.local',
        password: 'Demo@12345',
        profile_id: 'demo-student',
      },
      {
        id: 'demo-admin-user',
        email: 'admin@allexamspyq.local',
        password: 'Admin@12345',
        profile_id: 'demo-admin',
      },
    ],
    exams,
    subjects,
    chapters,
    topics,
    questions,
    options,
    profiles,
    tests,
    test_questions: testQuestions,
    test_attempts: testAttempts,
    user_answers: userAnswers,
    bookmarks: [
      {
        id: 'bookmark-demo-1',
        user_id: 'demo-student',
        question_id: 'q-ke-speed',
        notes: 'Review square-root relationship again.',
        created_at: yesterday,
      },
    ],
    leaderboard_scores: [
      {
        id: 'leader-demo-1',
        exam_id: 'jee-main',
        user_id: 'demo-student',
        total_score: 11,
        tests_taken: 2,
        total_correct: 3,
        total_questions: 4,
        updated_at: now,
        profile: { full_name: 'Demo Student', avatar_url: null },
      },
    ],
    reported_questions: [
      {
        id: 'report-demo-1',
        user_id: 'demo-student',
        question_id: 'q-recoil',
        reason: 'Explanation needs more detail',
        description: null,
        status: 'pending',
        admin_notes: null,
        created_at: yesterday,
        resolved_at: null,
      },
    ],
    syllabus_progress: [
      {
        id: 'progress-demo-1',
        user_id: 'demo-student',
        topic_id: 'limits',
        is_completed: true,
        completed_at: twoDaysAgo,
      },
    ],
  };
}
