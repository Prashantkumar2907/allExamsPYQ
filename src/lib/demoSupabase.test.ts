import { beforeEach, describe, expect, it } from 'vitest';
import { demoSupabase, resetDemoSupabase } from './demoSupabase';
import type { LeaderboardScore, TestAttempt, UserAnswer } from '../types/database';

async function signInDemoStudent() {
  const { error } = await demoSupabase.auth.signInWithPassword({
    email: 'demoaccount@allexamspyq.local',
    password: 'Demo@12345',
  });
  expect(error).toBeNull();
}

describe('demoSupabase secure attempt submission', () => {
  beforeEach(() => {
    resetDemoSupabase();
  });

  it('submits selected answers with server-owned scoring and leaderboard updates', async () => {
    await signInDemoStudent();

    const startResult = await demoSupabase.rpc('start_test_attempt', {
      p_test_id: 'jee-demo-mechanics',
    });
    expect(startResult.error).toBeNull();
    const attemptId = startResult.data as string;

    const submitResult = await demoSupabase.rpc('submit_attempt', {
      p_attempt_id: attemptId,
      p_answers: [
        { question_id: 'q-force-acceleration', selected_option_id: 'option-2' },
        { question_id: 'q-recoil', selected_option_id: 'option-5' },
      ],
    });
    expect(submitResult.error).toBeNull();

    const attemptResult = await demoSupabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    const attempt = attemptResult.data as TestAttempt;

    expect(attempt.status).toBe('completed');
    expect(attempt.score).toBe(3);
    expect(attempt.correct_answers).toBe(1);
    expect(attempt.wrong_answers).toBe(1);
    expect(attempt.skipped).toBe(1);

    const answerResult = await demoSupabase
      .from('user_answers')
      .select('*')
      .eq('attempt_id', attemptId);
    const answers = answerResult.data as UserAnswer[];
    expect(answers.find((answer) => answer.question_id === 'q-force-acceleration')?.is_correct).toBe(true);
    expect(answers.find((answer) => answer.question_id === 'q-recoil')?.is_correct).toBe(false);

    const leaderboardResult = await demoSupabase
      .from('leaderboard_scores')
      .select('*')
      .eq('exam_id', 'jee-main')
      .eq('user_id', 'demo-student')
      .single();
    const leaderboard = leaderboardResult.data as LeaderboardScore;
    expect(leaderboard.total_score).toBe(14);
    expect(leaderboard.tests_taken).toBe(3);
    expect(leaderboard.total_correct).toBe(4);
    expect(leaderboard.total_questions).toBe(7);
  });

  it('rejects answers where the selected option belongs to another question', async () => {
    await signInDemoStudent();

    const startResult = await demoSupabase.rpc('start_test_attempt', {
      p_test_id: 'jee-demo-mechanics',
    });
    const attemptId = startResult.data as string;

    const submitResult = await demoSupabase.rpc('submit_attempt', {
      p_attempt_id: attemptId,
      p_answers: [
        { question_id: 'q-force-acceleration', selected_option_id: 'option-10' },
      ],
    });

    expect(submitResult.error?.message).toContain('Selected option does not belong');

    const attemptResult = await demoSupabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    const attempt = attemptResult.data as TestAttempt;
    expect(attempt.status).toBe('in_progress');
    expect(attempt.score).toBe(0);
  });
});
