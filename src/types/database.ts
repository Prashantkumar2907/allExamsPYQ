export type QuestionType = 'single_choice' | 'multiple_choice' | 'numerical';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type UserRole = 'student' | 'admin';
export type TestStatus = 'draft' | 'active' | 'archived';
export type AttemptSource = 'test' | 'subject' | 'chapter' | 'topic';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Exam {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  exam_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  negative_marks: number;
  explanation: string | null;
  year: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: Option[];
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  explanation: string | null;
  sort_order: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  exam_id: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  exam?: Exam | null;
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  exam_id: string | null;
  is_global: boolean;
  duration_minutes: number;
  total_marks: number;
  shuffle_questions: boolean;
  allow_multiple_attempts: boolean;
  instructions: string | null;
  status: TestStatus;
  scheduled_at: string | null;
  scheduled_end_at: string | null;
  created_at: string;
  updated_at: string;
  exam?: Exam | null;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_id: string;
  sort_order: number;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  test_id: string | null;
  source_type: AttemptSource;
  source_id: string;
  source_name: string;
  score: number;
  total_marks: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped: number;
  time_taken_seconds: number | null;
  duration_minutes: number | null;
  status: AttemptStatus;
  started_at: string;
  completed_at: string | null;
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  question?: Question;
}

export interface Bookmark {
  id: string;
  user_id: string;
  question_id: string;
  notes: string | null;
  created_at: string;
  question?: Question;
}

export interface LeaderboardScore {
  id: string;
  exam_id: string;
  user_id: string;
  total_score: number;
  tests_taken: number;
  total_correct: number;
  total_questions: number;
  updated_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface ReportedQuestion {
  id: string;
  user_id: string;
  question_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  question?: Pick<Question, 'question_text'>;
  profile?: Pick<Profile, 'full_name' | 'email'>;
}

export interface SyllabusProgress {
  id: string;
  user_id: string;
  topic_id: string;
  is_completed: boolean;
  completed_at: string | null;
}
