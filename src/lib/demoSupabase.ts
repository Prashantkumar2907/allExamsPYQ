import { createDemoState, type DemoState, type DemoUser } from './demoData';

type DemoTableName = keyof DemoState;
type DemoRow = Record<string, unknown>;
type Filter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; values: unknown[] }
  | { type: 'not'; column: string; operator: string; value: unknown }
  | { type: 'gt' | 'gte'; column: string; value: unknown };

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

export const demoSupabase = {
  from(table: DemoTableName) {
    return new DemoQuery(table);
  },
  async rpc(functionName: string, params: Record<string, unknown>) {
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
