-- allExamsPYQ: Update 001 - Performance indexes & data integrity
-- Run this migration against your Supabase database

-- ============================================================
-- 1. Indexes for common queries
-- ============================================================

-- Bookmarks: user lookups + unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_question
  ON bookmarks (user_id, question_id);

-- Test attempts: user performance queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_status
  ON test_attempts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_test_attempts_completed
  ON test_attempts (user_id, completed_at DESC)
  WHERE status = 'completed';

-- Leaderboard: ranking queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_exam_score
  ON leaderboard_scores (exam_id, total_score DESC);

-- User answers: attempt lookups
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt
  ON user_answers (attempt_id);

-- Questions: topic + active filter
CREATE INDEX IF NOT EXISTS idx_questions_topic_active
  ON questions (topic_id, is_active);

-- Options: question lookups with ordering
CREATE INDEX IF NOT EXISTS idx_options_question_sort
  ON options (question_id, sort_order);

-- Reported questions: pending status for admin dashboard
CREATE INDEX IF NOT EXISTS idx_reported_pending
  ON reported_questions (status)
  WHERE status = 'pending';

-- Syllabus progress: user progress tracking
CREATE INDEX IF NOT EXISTS idx_syllabus_user
  ON syllabus_progress (user_id);

-- ============================================================
-- 2. RLS policy check - ensure admin has full access
-- ============================================================

-- Grant admin full CRUD on all tables
-- (Only needed if policies are missing)

DO $$
BEGIN
  -- Ensure admin can read all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage questions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Admins can manage questions'
  ) THEN
    CREATE POLICY "Admins can manage questions" ON questions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage options
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'options' AND policyname = 'Admins can manage options'
  ) THEN
    CREATE POLICY "Admins can manage options" ON options
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage tests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tests' AND policyname = 'Admins can manage tests'
  ) THEN
    CREATE POLICY "Admins can manage tests" ON tests
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage exams
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exams' AND policyname = 'Admins can manage exams'
  ) THEN
    CREATE POLICY "Admins can manage exams" ON exams
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage subjects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subjects' AND policyname = 'Admins can manage subjects'
  ) THEN
    CREATE POLICY "Admins can manage subjects" ON subjects
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage chapters
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chapters' AND policyname = 'Admins can manage chapters'
  ) THEN
    CREATE POLICY "Admins can manage chapters" ON chapters
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage topics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'topics' AND policyname = 'Admins can manage topics'
  ) THEN
    CREATE POLICY "Admins can manage topics" ON topics
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can manage reported questions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reported_questions' AND policyname = 'Admins can manage reports'
  ) THEN
    CREATE POLICY "Admins can manage reports" ON reported_questions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- Ensure admin can view all test attempts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'test_attempts' AND policyname = 'Admins can view all attempts'
  ) THEN
    CREATE POLICY "Admins can view all attempts" ON test_attempts
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
