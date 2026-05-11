import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlocker } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Send,
} from 'lucide-react';
import type { Question, TestAttempt, Option } from '../../types/database';

export default function TestTakingPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitPromptOpen, setSubmitPromptOpen] = useState(false);
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef<TestAttempt | null>(null);
  const questionsRef = useRef<Question[]>([]);
  const answersRef = useRef<Record<string, string | null>>({});
  const submittingRef = useRef(false);
  const allowNavigationRef = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    Boolean(
      attempt &&
        questions.length > 0 &&
        !submittingRef.current &&
        !allowNavigationRef.current &&
        currentLocation.pathname !== nextLocation.pathname
    )
  );

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (blocker.state === 'blocked') setLeavePromptOpen(true);
  }, [blocker.state]);

  useEffect(() => {
    if (!attempt || !questions.length || submitting) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt, questions.length, submitting]);

  useEffect(() => {
    setPage('Test', '');
    if (attemptId) loadAttempt();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [attemptId]);

  async function loadAttempt() {
    setLoading(true);
    setError('');

    try {
      const { data: att, error: attemptError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId!)
        .single();

      if (attemptError) throw attemptError;
      if (!att) throw new Error('This test attempt could not be found.');
      if (att.status === 'completed') {
        allowNavigationRef.current = true;
        navigate(`/result/${attemptId}`);
        return;
      }

      setAttempt(att);
      attemptRef.current = att;

      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id, selected_option_id')
        .eq('attempt_id', attemptId!);

      if (answersError) throw answersError;

      const questionIds = userAnswers?.map((a) => a.question_id) ?? [];
      const existingAnswers: Record<string, string | null> = {};
      userAnswers?.forEach((a) => {
        existingAnswers[a.question_id] = a.selected_option_id;
      });
      setAnswers(existingAnswers);

      if (questionIds.length > 0) {
        const { data: qData, error: questionsError } = await supabase
        .from('questions')
        .select('*, options(*)')
        .in('id', questionIds);
        if (questionsError) throw questionsError;
        if (qData) {
          const qMap = new Map(qData.map((q) => [q.id, q]));
          const orderedQuestions = questionIds.map((id) => qMap.get(id)!).filter(Boolean);
          setQuestions(orderedQuestions);
          questionsRef.current = orderedQuestions;
        }
      } else {
        setQuestions([]);
        questionsRef.current = [];
      }

      const durationMs = (att.duration_minutes ?? 60) * 60 * 1000;
      const elapsed = Date.now() - new Date(att.started_at).getTime();
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setTimeLeft(remaining);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            void handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this test attempt.'));
    } finally {
      setLoading(false);
    }
  }

  const selectAnswer = useCallback(async (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };
      answersRef.current = next;
      return next;
    });
    const question = questions.find((q) => q.id === questionId);
    const option = question?.options?.find((o) => o.id === optionId);
    const { error: saveError } = await supabase
      .from('user_answers')
      .update({
        selected_option_id: optionId,
        is_correct: option?.is_correct ?? null,
      })
      .eq('attempt_id', attemptId!)
      .eq('question_id', questionId);
    if (saveError) toast.error(getErrorMessage(saveError, 'Could not save that answer.'));
  }, [questions, attemptId]);

  function requestSubmit() {
    const unanswered = questionsRef.current.filter((q) => !answersRef.current[q.id]).length;
    if (unanswered > 0) {
      setSubmitPromptOpen(true);
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const latestQuestions = questionsRef.current;
      const latestAnswers = answersRef.current;
      const latestAttempt = attemptRef.current;

      if (latestQuestions.length === 0) {
        throw new Error('This attempt has no questions to submit.');
      }

      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let score = 0;

      latestQuestions.forEach((q) => {
        const selectedId = latestAnswers[q.id];
        if (!selectedId) {
          skipped++;
          return;
        }
        const option = q.options?.find((o) => o.id === selectedId);
        if (option?.is_correct) {
          correct++;
          score += q.marks;
        } else {
          wrong++;
          score -= q.negative_marks;
        }
      });

      const finalScore = Math.max(0, score);
      const startedAt = latestAttempt?.started_at ? new Date(latestAttempt.started_at).getTime() : Date.now();
      const timeTaken = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

      const { error: submitError } = await supabase
        .from('test_attempts')
        .update({
          score: finalScore,
          correct_answers: correct,
          wrong_answers: wrong,
          skipped,
          time_taken_seconds: timeTaken,
          status: 'completed' as const,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId!);

      if (submitError) throw submitError;

      if (latestAttempt?.source_type !== 'test' && profile?.id) {
        const topicIds = [...new Set(latestQuestions.map((q) => q.topic_id).filter(Boolean))];
        if (topicIds.length > 0) {
          const { error: progressError } = await supabase.from('syllabus_progress').upsert(
            topicIds.map((topicId) => ({
              user_id: profile.id,
              topic_id: topicId,
              is_completed: true,
              completed_at: new Date().toISOString(),
            })),
            { onConflict: 'user_id,topic_id' }
          );
          if (progressError) toast.warning(getErrorMessage(progressError, 'Progress could not be updated.'));
        }
      }

      if (latestAttempt?.test_id && profile?.exam_id) {
        const { error: leaderboardError } = await supabase.rpc('record_leaderboard_attempt', {
          p_exam_id: profile.exam_id,
          p_user_id: profile.id,
          p_score: finalScore,
          p_correct: correct,
          p_questions: latestQuestions.length,
        });
        if (leaderboardError) toast.warning(getErrorMessage(leaderboardError, 'Leaderboard could not be updated.'));
      }

      allowNavigationRef.current = true;
      navigate(`/result/${attemptId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit this test.'));
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState description={error} onRetry={loadAttempt} />;
  if (!questions.length) {
    return (
      <EmptyState
        title="No questions in this attempt"
        description="Ask an admin to add questions to this test before starting it."
        action={<Button size="sm" variant="secondary" onClick={() => navigate('/tests')}>Back to Tests</Button>}
      />
    );
  }

  const question = questions[currentIdx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const totalDuration = (attempt?.duration_minutes ?? 60) * 60;
  const timePercent = totalDuration ? (timeLeft / totalDuration) * 100 : 100;
  const timerColor = timePercent > 50 ? 'text-green-500' : timePercent > 20 ? 'text-amber-500' : 'text-red-500';
  const timerBg = timePercent > 50 ? 'bg-green-500/10' : timePercent > 20 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="h-full flex flex-col overflow-hidden -m-3">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="text-sm font-semibold text-[var(--fg)] truncate max-w-[40%]">
          {attempt?.source_name}
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-mono font-bold transition-colors',
          timerColor, timerBg
        )}>
          <Clock className="h-4 w-4" />
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <Button size="sm" onClick={requestSubmit} loading={submitting}>
          <Send className="h-3.5 w-3.5" /> Submit
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-4">
          {question && (
            <div className="max-w-2xl mx-auto space-y-4 animate-fade-in" key={question.id}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--fg-muted)]">
                  Question {currentIdx + 1} <span className="text-[var(--fg-muted)]">of {questions.length}</span>
                </span>
                <button
                  onClick={() =>
                    setFlagged((prev) => {
                      const next = new Set(prev);
                      next.has(question.id) ? next.delete(question.id) : next.add(question.id);
                      return next;
                    })
                  }
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition',
                    flagged.has(question.id)
                      ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                      : 'text-[var(--fg-muted)] border-[var(--border)] hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5'
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {flagged.has(question.id) ? 'Flagged' : 'Flag'}
                </button>
              </div>

              <Card>
                <p className="text-sm text-[var(--fg)] leading-relaxed">{question.question_text}</p>
                {question.marks && (
                  <div className="flex gap-3 mt-3 text-[11px] text-[var(--fg-muted)]">
                    <span className="text-green-500">+{question.marks} marks</span>
                    <span className="text-red-400">-{question.negative_marks} negative</span>
                  </div>
                )}
              </Card>

              <div className="space-y-2">
                {question.options
                  ?.sort((a, b) => a.sort_order - b.sort_order)
                  .map((opt, oi) => (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(question.id, opt.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition duration-150 cursor-pointer',
                        answers[question.id] === opt.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/8 text-[var(--fg)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--fg)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/3'
                      )}
                    >
                      <span
                        className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition',
                          answers[question.id] === opt.id
                            ? 'bg-[var(--primary)] text-[var(--primary-fg)] scale-110'
                            : 'bg-[var(--bg-surface-hover)] text-[var(--fg-muted)]'
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className={cn(answers[question.id] === opt.id && 'font-medium')}>{opt.option_text}</span>
                    </button>
                  ))}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => i - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx((i) => i + 1)}
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Question nav panel */}
        <div className="hidden md:flex flex-col w-52 border-l border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <div className="text-xs font-medium text-[var(--fg)] mb-3">
            <span className="text-[var(--primary)]">{answeredCount}</span>
            <span className="text-[var(--fg-muted)]"> / {questions.length} answered</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 overflow-y-auto">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={cn(
                  'h-8 w-8 rounded-full text-[11px] font-semibold transition duration-100 cursor-pointer flex items-center justify-center',
                  i === currentIdx && 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--bg-surface)]',
                  answers[q.id]
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)]'
                    : flagged.has(q.id)
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--fg-muted)] hover:bg-[var(--bg-body)]'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-auto pt-3 border-t border-[var(--border)] space-y-2 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--primary)]" />
              <span className="text-[var(--fg-muted)]">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
              <span className="text-[var(--fg-muted)]">Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--bg-surface-hover)]" />
              <span className="text-[var(--fg-muted)]">Unanswered</span>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={submitPromptOpen}
        onOpenChange={setSubmitPromptOpen}
        title="Submit test"
        description={`You still have ${unansweredCount} unanswered ${unansweredCount === 1 ? 'question' : 'questions'}. Submit now and mark them as skipped?`}
        confirmLabel="Submit anyway"
        onConfirm={() => {
          setSubmitPromptOpen(false);
          void handleSubmit();
        }}
        loading={submitting}
        variant="primary"
      />
      <ConfirmDialog
        open={leavePromptOpen}
        onOpenChange={(open) => {
          setLeavePromptOpen(open);
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title="Leave test?"
        description="Your saved answers will remain, but the timer keeps running until you submit the test."
        confirmLabel="Leave"
        onConfirm={() => {
          allowNavigationRef.current = true;
          setLeavePromptOpen(false);
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </div>
  );
}
