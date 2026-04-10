-- allExamsPYQ: Update 002 - Fix RLS infinite recursion on profiles table
-- Run this migration against your Supabase database
--
-- ISSUE: update_001.sql created admin policies that check the profiles table
-- from within the profiles RLS policy itself, causing PostgreSQL error 42P17:
-- "infinite recursion detected in policy for relation profiles"
--
-- FIX: Create a SECURITY DEFINER helper function that bypasses RLS to check
-- admin status, then replace all recursive admin policies.

-- ============================================================
-- 1. Create helper function (bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Fix profiles table policy (the one causing recursion)
-- ============================================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Re-create using the helper function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- ============================================================
-- 3. Fix all other admin policies to use is_admin()
-- ============================================================

-- Questions
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (public.is_admin());

-- Options
DROP POLICY IF EXISTS "Admins can manage options" ON options;
CREATE POLICY "Admins can manage options" ON options
  FOR ALL USING (public.is_admin());

-- Tests
DROP POLICY IF EXISTS "Admins can manage tests" ON tests;
CREATE POLICY "Admins can manage tests" ON tests
  FOR ALL USING (public.is_admin());

-- Exams
DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
CREATE POLICY "Admins can manage exams" ON exams
  FOR ALL USING (public.is_admin());

-- Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (public.is_admin());

-- Chapters
DROP POLICY IF EXISTS "Admins can manage chapters" ON chapters;
CREATE POLICY "Admins can manage chapters" ON chapters
  FOR ALL USING (public.is_admin());

-- Topics
DROP POLICY IF EXISTS "Admins can manage topics" ON topics;
CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL USING (public.is_admin());

-- Reported questions
DROP POLICY IF EXISTS "Admins can manage reports" ON reported_questions;
CREATE POLICY "Admins can manage reports" ON reported_questions
  FOR ALL USING (public.is_admin());

-- Test attempts (admin read)
DROP POLICY IF EXISTS "Admins can view all attempts" ON test_attempts;
CREATE POLICY "Admins can view all attempts" ON test_attempts
  FOR SELECT USING (public.is_admin());
