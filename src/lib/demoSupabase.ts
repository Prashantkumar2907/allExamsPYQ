import { createDemoState, type DemoState, type DemoUser } from './demoData';

type DemoTableName = keyof DemoState;
type DemoRow = Record<string, unknown>;
type Filter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; values: unknown[] }
  | { type: 'not'; column: string; operator: string; value: unknown }
  | { type: 'gt' | 'gte' | 'lt' | 'lte'; column: string; value: unknown };

type QueryResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

const stateKey = 'allexamspyq-demo-state-v3';
const sessionKey = 'allexamspyq-demo-session-v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState(): DemoState {
  try {
    const stored = localStorage.getItem(stateKey);
    if (stored) return JSON.parse(stored) as DemoState;
  } catch {
    // Ignore storage failures and use a fresh demo seed.
  }
  const state = createDemoState();
  saveState(state);
  return state;
}

function saveState(state: DemoState) {
  try {
    localStorage.setItem(stateKey, JSON.stringify(state));
  } catch {
    // Demo mode can still run without persistence.
  }
}

function getStateTable(state: DemoState, table: DemoTableName): DemoRow[] {
  return state[table] as unknown as DemoRow[];
}

function getValue(row: DemoRow, column: string, state: DemoState): unknown {
  if (column === 'chapters.subjects.exam_id') {
    const topic = row as { chapter_id?: string };
    const chapter = state.chapters.find((item) => item.id === topic.chapter_id);
    const subject = state.subjects.find((item) => item.id === chapter?.subject_id);
    return subject?.exam_id;
  }
  return row[column];
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === 'string' && typeof right === 'string') {
    return new Date(left).toString() !== 'Invalid Date' && new Date(right).toString() !== 'Invalid Date'
      ? new Date(left).getTime() - new Date(right).getTime()
      : left.localeCompare(right);
  }
  return Number(left) - Number(right);
}

function matchesFilter(row: DemoRow, filter: Filter, state: DemoState) {
  const value = getValue(row, filter.column, state);
  if (filter.type === 'eq') return value === filter.value;
  if (filter.type === 'in') return filter.values.includes(value);
  if (filter.type === 'gt') return compareValues(value, filter.value) > 0;
  if (filter.type === 'gte') return compareValues(value, filter.value) >= 0;
  if (filter.type === 'lt') return compareValues(value, filter.value) < 0;
  if (filter.type === 'lte') return compareValues(value, filter.value) <= 0;
  if (filter.type === 'not' && filter.operator === 'is' && filter.value === null) return value !== null;
  return true;
}

function attachRelations(table: DemoTableName, row: DemoRow, selectQuery: string, state: DemoState): DemoRow {
  const next = clone(row);

  if (table === 'profiles' && selectQuery.includes('exam:exams')) {
    next.exam = state.exams.find((exam) => exam.id === next.exam_id) ?? null;
  }

  if (table === 'tests' && selectQuery.includes('exam:exams')) {
    next.exam = state.exams.find((exam) => exam.id === next.exam_id) ?? null;
  }

  if (table === 'questions' && selectQuery.includes('options')) {
    next.options = state.options
      .filter((option) => option.question_id === next.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  if (table === 'questions' && selectQuery.includes('topic:topics')) {
    const topic = state.topics.find((item) => item.id === next.topic_id);
    if (topic) {
      const chapter = state.chapters.find((item) => item.id === topic.chapter_id);
      const subject = state.subjects.find((item) => item.id === chapter?.subject_id);
      next.topic = {
        ...topic,
        chapter: chapter ? { ...chapter, subject: subject ? { ...subject } : null } : null,
      };
    }
  }

  if (table === 'user_answers' && selectQuery.includes('question:questions')) {
    const question = state.questions.find((item) => item.id === next.question_id);
    next.question = question
      ? attachRelations('questions', question as unknown as DemoRow, '*, options(*)', state)
      : null;
  }

  if (table === 'bookmarks' && selectQuery.includes('question:questions')) {
    const question = state.questions.find((item) => item.id === next.question_id);
    next.question = question
      ? attachRelations('questions', question as unknown as DemoRow, '*, options(*), topic:topics(*)', state)
      : null;
  }

  if (table === 'leaderboard_scores' && selectQuery.includes('profile:profiles')) {
    const profile = state.profiles.find((item) => item.id === next.user_id);
    next.profile = profile
      ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
      : null;
  }

  if (table === 'reported_questions') {
    if (selectQuery.includes('question:questions')) {
      const question = state.questions.find((item) => item.id === next.question_id);
      next.question = question ? { question_text: question.question_text } : null;
    }
    if (selectQuery.includes('profile:profiles')) {
      const profile = state.profiles.find((item) => item.id === next.user_id);
      next.profile = profile ? { full_name: profile.full_name, email: profile.email } : null;
    }
  }

  if (table === 'test_attempts' && selectQuery.includes('profile:profiles')) {
    const profile = state.profiles.find((item) => item.id === next.user_id);
    next.profile = profile ? { full_name: profile.full_name } : null;
  }

  if (table === 'test_questions' && selectQuery.includes('question:questions')) {
    const question = state.questions.find((item) => item.id === next.question_id);
    next.question = question
      ? {
          id: question.id,
          question_text: question.question_text,
          difficulty: question.difficulty,
          marks: question.marks,
          year: question.year,
        }
      : null;
  }

  return next;
}

function defaultsFor(table: DemoTableName, row: DemoRow): DemoRow {
  const timestamp = new Date().toISOString();
  const withId = { id: row.id ?? createId(String(table)), ...row };

  if (table === 'test_attempts') {
    return {
      score: 0,
      correct_answers: 0,
      wrong_answers: 0,
      skipped: 0,
      time_taken_seconds: null,
      started_at: timestamp,
      completed_at: null,
      ...withId,
    };
  }

  if (table === 'user_answers') {
    return {
      selected_option_id: null,
      is_correct: null,
      time_spent_seconds: 0,
      ...withId,
    };
  }

  if (table === 'questions') {
    return {
      question_type: 'single_choice',
      difficulty: 'medium',
      marks: 4,
      negative_marks: 1,
      explanation: null,
      year: null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
      ...withId,
    };
  }

  if (table === 'tests') {
    return {
      is_global: false,
      duration_minutes: 60,
      total_marks: 100,
      shuffle_questions: true,
      allow_multiple_attempts: false,
      status: 'draft',
      scheduled_at: null,
      scheduled_end_at: null,
      created_at: timestamp,
      updated_at: timestamp,
      ...withId,
    };
  }

  if (['exams', 'subjects', 'chapters', 'topics', 'bookmarks', 'reported_questions'].includes(table)) {
    return { created_at: timestamp, ...withId };
  }

  return withId;
}

class DemoQuery {
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private filters: Filter[] = [];
  private selectQuery = '*';
  private selectOptions: { count?: 'exact'; head?: boolean } = {};
  private orderSpec: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private rangeSpec: { from: number; to: number } | null = null;
  private singleResult = false;
  private payload: unknown;
  private upsertConflict: string[] = [];

  constructor(private table: DemoTableName) {}

  select(query = '*', options: { count?: 'exact'; head?: boolean } = {}) {
    this.selectQuery = query;
    this.selectOptions = options;
    return this;
  }

  insert(payload: unknown) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(payload: unknown, options: { onConflict?: string } = {}) {
    this.action = 'upsert';
    this.payload = payload;
    this.upsertConflict = options.onConflict?.split(',').map((item) => item.trim()) ?? ['id'];
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.filters.push({ type: 'not', column, operator, value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderSpec = { column, ascending: options.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeSpec = { from, to };
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private getFilteredRows(state: DemoState) {
    return getStateTable(state, this.table).filter((row) =>
      this.filters.every((filter) => matchesFilter(row, filter, state))
    );
  }

  private applyWindow(rows: DemoRow[]) {
    let next = [...rows];
    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      next.sort((a, b) => {
        const comparison = compareValues(a[column], b[column]);
        return ascending ? comparison : -comparison;
      });
    }
    if (this.rangeSpec) next = next.slice(this.rangeSpec.from, this.rangeSpec.to + 1);
    if (this.limitCount != null) next = next.slice(0, this.limitCount);
    return next;
  }

  private shapeResult(rows: DemoRow[], totalCount: number): QueryResult {
    if (this.selectOptions.head) {
      return { data: null, error: null, count: totalCount };
    }

    const state = loadState();
    const data = rows.map((row) => attachRelations(this.table, row, this.selectQuery, state));
    if (this.singleResult) {
      return {
        data: data[0] ?? null,
        error: data[0] ? null : { message: 'No rows returned in demo mode.' },
        count: this.selectOptions.count ? totalCount : null,
      };
    }
    return {
      data,
      error: null,
      count: this.selectOptions.count ? totalCount : null,
    };
  }

  private async execute(): Promise<QueryResult> {
    const state = loadState();
    const tableRows = getStateTable(state, this.table);

    if (this.action === 'insert') {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]) as DemoRow[];
      const created = rows.map((row) => defaultsFor(this.table, row));
      tableRows.push(...created);
      saveState(state);
      return this.shapeResult(this.applyWindow(created), created.length);
    }

    if (this.action === 'update') {
      const matching = this.getFilteredRows(state);
      matching.forEach((row) => {
        Object.assign(row, this.payload, 'updated_at' in row ? { updated_at: new Date().toISOString() } : {});
      });
      saveState(state);
      return this.shapeResult(this.applyWindow(matching), matching.length);
    }

    if (this.action === 'delete') {
      const matching = new Set(this.getFilteredRows(state));
      state[this.table] = tableRows.filter((row) => !matching.has(row)) as never;
      saveState(state);
      return { data: null, error: null, count: matching.size };
    }

    if (this.action === 'upsert') {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]) as DemoRow[];
      const changed: DemoRow[] = [];
      rows.forEach((row) => {
        const existing = tableRows.find((item) =>
          this.upsertConflict.every((column) => item[column] === row[column])
        );
        if (existing) {
          Object.assign(existing, row, 'updated_at' in existing ? { updated_at: new Date().toISOString() } : {});
          changed.push(existing);
        } else {
          const created = defaultsFor(this.table, row);
          tableRows.push(created);
          changed.push(created);
        }
      });
      saveState(state);
      return this.shapeResult(this.applyWindow(changed), changed.length);
    }

    const filtered = this.getFilteredRows(state);
    return this.shapeResult(this.applyWindow(filtered), filtered.length);
  }
}

function createSession(user: DemoUser) {
  return {
    access_token: `demo-token-${user.id}`,
    refresh_token: `demo-refresh-${user.id}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: user.profile_id,
      email: user.email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
}

type AuthListener = (event: string, session: ReturnType<typeof createSession> | null) => void | Promise<void>;
const listeners = new Set<AuthListener>();

function readSession() {
  try {
    const stored = localStorage.getItem(sessionKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeSession(session: ReturnType<typeof createSession> | null) {
  if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
  else localStorage.removeItem(sessionKey);
}

function emitAuth(event: string, session: ReturnType<typeof createSession> | null) {
  listeners.forEach((listener) => void listener(event, session));
}

function getCurrentProfile(state: DemoState) {
  const session = readSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  return state.profiles.find((profile) => profile.id === userId) ?? null;
}

function getTopicExamId(state: DemoState, topicId: string) {
  const topic = state.topics.find((item) => item.id === topicId);
  const chapter = state.chapters.find((item) => item.id === topic?.chapter_id);
  const subject = state.subjects.find((item) => item.id === chapter?.subject_id);
  return subject?.exam_id ?? null;
}

function getAdminDashboardSummary(params: Record<string, unknown>): QueryResult<Record<string, unknown>> {
  const state = loadState();
  const profile = getCurrentProfile(state);
  if (profile?.role !== 'admin') {
    return { data: null, error: { message: 'Only admins can read admin dashboard summary.' } };
  }

  const requestedDays = Number(params.p_days ?? 7);
  const days = Math.min(Math.max(Number.isFinite(requestedDays) ? requestedDays : 7, 1), 30);
  const requestedRecentLimit = Number(params.p_recent_limit ?? 5);
  const recentLimit = Math.min(Math.max(Number.isFinite(requestedRecentLimit) ? requestedRecentLimit : 5, 1), 25);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daily_attempts = Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - index - 1));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const count = state.test_attempts.filter((attempt) => {
      if (attempt.status !== 'completed' || !attempt.completed_at) return false;
      const completedAt = new Date(attempt.completed_at).getTime();
      return completedAt >= day.getTime() && completedAt < nextDay.getTime();
    }).length;
    return {
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    };
  });

  const difficulty_data = (['easy', 'medium', 'hard'] as const)
    .map((name) => ({
      name,
      count: state.questions.filter((question) => question.difficulty === name).length,
    }))
    .filter((item) => item.count > 0);

  const recent_attempts = state.test_attempts
    .filter((attempt) => attempt.status === 'completed')
    .sort((left, right) => (right.completed_at ?? '').localeCompare(left.completed_at ?? ''))
    .slice(0, recentLimit)
    .map((attempt) => {
      const attemptProfile = state.profiles.find((item) => item.id === attempt.user_id);
      return {
        id: attempt.id,
        source_name: attempt.source_name,
        score: attempt.score,
        total_marks: attempt.total_marks,
        completed_at: attempt.completed_at,
        profile: { full_name: attemptProfile?.full_name ?? 'Unknown' },
      };
    });

  return {
    data: {
      stats: {
        users: state.profiles.length,
        exams: state.exams.length,
        questions: state.questions.length,
        tests: state.tests.length,
        attempts: state.test_attempts.length,
      },
      reported_count: state.reported_questions.filter((report) => report.status === 'pending').length,
      difficulty_data,
      daily_attempts,
      recent_attempts,
    },
    error: null,
  };
}

function createAttemptWithAnswers(
  state: DemoState,
  attemptPayload: DemoRow,
  questionIds: string[]
) {
  const attempt = defaultsFor('test_attempts', attemptPayload) as unknown as DemoState['test_attempts'][number];
  state.test_attempts.push(attempt);
  questionIds.forEach((questionId) => {
    state.user_answers.push(defaultsFor('user_answers', {
      attempt_id: attempt.id,
      question_id: questionId,
      time_spent_seconds: 0,
    }) as unknown as DemoState['user_answers'][number]);
  });
  saveState(state);
  return attempt.id;
}

function startDemoTestAttempt(params: Record<string, unknown>): QueryResult<string> {
  const state = loadState();
  const profile = getCurrentProfile(state);
  if (!profile) return { data: null, error: { message: 'Authentication required' } };

  const testId = String(params.p_test_id ?? '');
  const test = state.tests.find((item) => item.id === testId);
  const nowMs = Date.now();
  const opensAt = test?.scheduled_at ? new Date(test.scheduled_at).getTime() : null;
  const closesAt = test?.scheduled_end_at ? new Date(test.scheduled_end_at).getTime() : null;

  if (
    !test ||
    test.status !== 'active' ||
    (opensAt != null && nowMs < opensAt) ||
    (closesAt != null && nowMs > closesAt) ||
    (!test.is_global && test.exam_id !== profile.exam_id)
  ) {
    return { data: null, error: { message: 'This test is not available.' } };
  }

  if (!test.allow_multiple_attempts) {
    const completed = state.test_attempts.some(
      (attempt) => attempt.user_id === profile.id && attempt.test_id === test.id && attempt.status === 'completed'
    );
    if (completed) {
      return { data: null, error: { message: 'You have already completed this test.' } };
    }
  }

  const questionIds = state.test_questions
    .filter((row) => row.test_id === test.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => row.question_id);

  if (questionIds.length === 0) {
    return { data: null, error: { message: 'This test does not have questions assigned yet.' } };
  }

  const attemptQuestionIds = test.shuffle_questions
    ? [...questionIds].sort(() => Math.random() - 0.5)
    : questionIds;

  const attemptId = createAttemptWithAnswers(state, {
    user_id: profile.id,
    test_id: test.id,
    source_type: 'test',
    source_id: test.id,
    source_name: test.title,
    total_questions: attemptQuestionIds.length,
    total_marks: test.total_marks,
    duration_minutes: test.duration_minutes,
    status: 'in_progress',
  }, attemptQuestionIds);

  return { data: attemptId, error: null };
}

function startDemoPracticeAttempt(params: Record<string, unknown>): QueryResult<string> {
  const state = loadState();
  const profile = getCurrentProfile(state);
  if (!profile) return { data: null, error: { message: 'Authentication required' } };
  if (!profile.exam_id) return { data: null, error: { message: 'Select an exam before starting practice.' } };

  const sourceType = String(params.p_source_type ?? '');
  const sourceId = String(params.p_source_id ?? '');
  let sourceName = '';
  let sourceExamId: string | null = null;
  let topicIds: string[] = [];

  if (sourceType === 'topic') {
    const topic = state.topics.find((item) => item.id === sourceId);
    sourceName = topic?.name ?? '';
    sourceExamId = getTopicExamId(state, sourceId);
    topicIds = topic ? [topic.id] : [];
  } else if (sourceType === 'chapter') {
    const chapter = state.chapters.find((item) => item.id === sourceId);
    const subject = state.subjects.find((item) => item.id === chapter?.subject_id);
    sourceName = chapter?.name ?? '';
    sourceExamId = subject?.exam_id ?? null;
    topicIds = state.topics.filter((topic) => topic.chapter_id === sourceId).map((topic) => topic.id);
  } else if (sourceType === 'subject') {
    const subject = state.subjects.find((item) => item.id === sourceId);
    const chapterIds = state.chapters
      .filter((chapter) => chapter.subject_id === sourceId)
      .map((chapter) => chapter.id);
    sourceName = subject?.name ?? '';
    sourceExamId = subject?.exam_id ?? null;
    topicIds = state.topics.filter((topic) => chapterIds.includes(topic.chapter_id)).map((topic) => topic.id);
  } else {
    return { data: null, error: { message: 'Unsupported practice source type.' } };
  }

  if (!sourceName) return { data: null, error: { message: 'Practice source not found.' } };
  if (sourceExamId !== profile.exam_id) {
    return { data: null, error: { message: 'This practice content is not available for your exam.' } };
  }

  const questions = state.questions
    .filter((question) => topicIds.includes(question.topic_id) && question.is_active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);

  if (questions.length === 0) {
    return { data: null, error: { message: 'No active questions found for this selection yet.' } };
  }

  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  const attemptId = createAttemptWithAnswers(state, {
    user_id: profile.id,
    test_id: null,
    source_type: sourceType,
    source_id: sourceId,
    source_name: sourceName,
    total_questions: questions.length,
    total_marks: totalMarks,
    duration_minutes: Math.max(questions.length * 2, 10),
    status: 'in_progress',
  }, questions.map((question) => question.id));

  return { data: attemptId, error: null };
}

export const demoSupabase = {
  from(table: DemoTableName) {
    return new DemoQuery(table);
  },
  async rpc(functionName: string, params: Record<string, unknown>) {
    if (functionName === 'count_exam_topics') {
      const state = loadState();
      const examId = String(params.p_exam_id ?? '');
      const count = state.topics.filter((topic) => getTopicExamId(state, topic.id) === examId).length;
      return { data: count, error: null };
    }

    if (functionName === 'get_admin_dashboard_summary') {
      return getAdminDashboardSummary(params);
    }

    if (functionName === 'get_leaderboard') {
      const state = loadState();
      const examId = String(params.p_exam_id ?? '');
      const requestedLimit = Number(params.p_limit ?? 50);
      const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100);
      const data = state.leaderboard_scores
        .filter((row) => row.exam_id === examId)
        .sort((a, b) => b.total_score - a.total_score || a.updated_at.localeCompare(b.updated_at))
        .slice(0, limit)
        .map((row) => {
          const profile = state.profiles.find((item) => item.id === row.user_id);
          return {
            id: row.id,
            user_id: row.user_id,
            total_score: row.total_score,
            tests_taken: row.tests_taken,
            total_correct: row.total_correct,
            total_questions: row.total_questions,
            full_name: profile?.full_name ?? 'Anonymous',
            avatar_url: profile?.avatar_url ?? null,
          };
        });
      return { data, error: null };
    }

    if (functionName === 'start_test_attempt') {
      return startDemoTestAttempt(params);
    }

    if (functionName === 'start_practice_attempt') {
      return startDemoPracticeAttempt(params);
    }

    if (functionName !== 'record_leaderboard_attempt') {
      return { data: null, error: { message: `Unsupported demo RPC: ${functionName}` } };
    }

    const state = loadState();
    const examId = String(params.p_exam_id ?? '');
    const userId = String(params.p_user_id ?? '');
    const score = Math.max(0, Number(params.p_score ?? 0));
    const correct = Math.max(0, Number(params.p_correct ?? 0));
    const questions = Math.max(0, Number(params.p_questions ?? 0));

    if (!examId || !userId) {
      return { data: null, error: { message: 'Missing leaderboard exam or user id.' } };
    }

    const existing = state.leaderboard_scores.find(
      (row) => row.exam_id === examId && row.user_id === userId
    );

    if (existing) {
      existing.total_score += score;
      existing.tests_taken += 1;
      existing.total_correct += correct;
      existing.total_questions += questions;
      existing.updated_at = new Date().toISOString();
    } else {
      state.leaderboard_scores.push({
        id: createId('leaderboard'),
        exam_id: examId,
        user_id: userId,
        total_score: score,
        tests_taken: 1,
        total_correct: correct,
        total_questions: questions,
        updated_at: new Date().toISOString(),
      });
    }

    saveState(state);
    return { data: null, error: null };
  },
  auth: {
    async getSession() {
      return { data: { session: readSession() }, error: null };
    },
    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const state = loadState();
      const user = state.demo_users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
      );
      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Invalid demo email or password.' } };
      }
      const session = createSession(user);
      writeSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string; exam_id?: string } };
    }) {
      const state = loadState();
      if (state.demo_users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return { data: { user: null, session: null }, error: { message: 'Demo user already exists.' } };
      }
      const profileId = createId('profile');
      const user: DemoUser = {
        id: createId('user'),
        email,
        password,
        profile_id: profileId,
      };
      state.demo_users.push(user);
      state.profiles.push({
        id: profileId,
        full_name: options?.data?.full_name || email.split('@')[0],
        email,
        phone: null,
        avatar_url: null,
        role: 'student',
        exam_id: options?.data?.exam_id || null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      saveState(state);
      const session = createSession(user);
      writeSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signOut() {
      writeSession(null);
      emitAuth('SIGNED_OUT', null);
      return { error: null };
    },
  },
};

export function resetDemoSupabase() {
  localStorage.removeItem(stateKey);
  localStorage.removeItem(sessionKey);
}
