import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../lib/api';
import { cn, getScorePercentage, getAccuracy, formatTime } from '../../lib/utils';
import { REPORT_REASONS } from '../../lib/constants';
import {
  Trophy,
  CheckCircle,
  XCircle,
  MinusCircle,
  Bookmark,
  BookmarkCheck,
  Flag,
  ArrowLeft,
  Clock,
  Target,
  Award,
  Hash,
  Plus,
  Minus,
} from 'lucide-react';
import type { TestAttempt, UserAnswer } from '../../types/database';

export default function TestResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [bookmarkQuestionId, setBookmarkQuestionId] = useState('');
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [savingBookmark, setSavingBookmark] = useState(false);

  useEffect(() => {
    setPage('Test Result', '');
    loadResult();
  }, [attemptId]);

  async function loadResult() {
    setLoading(true);
    setError('');
    try {
      const [attRes, ansRes, bmRes] = await Promise.all([
        supabase.from('test_attempts').select('*').eq('id', attemptId!).single(),
        supabase.from('user_answers').select('*, question:questions(*, options(*))').eq('attempt_id', attemptId!),
        supabase.from('bookmarks').select('question_id').eq('user_id', profile!.id),
      ]);

      if (attRes.error) throw attRes.error;
      if (ansRes.error) throw ansRes.error;
      if (bmRes.error) throw bmRes.error;
      if (!attRes.data) throw new Error('This result could not be found.');

      setAttempt(attRes.data);
      setPage('Test Result', attRes.data.source_name);
      setAnswers((ansRes.data || []) as UserAnswer[]);
      setBookmarkedIds(new Set((bmRes.data || []).map((b) => b.question_id)));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this test result.'));
    } finally {
      setLoading(false);
    }
  }

  async function toggleBookmark(questionId: string) {
    if (bookmarkedIds.has(questionId)) {
      const { error: deleteError } = await supabase.from('bookmarks').delete().eq('user_id', profile!.id).eq('question_id', questionId);
      if (deleteError) {
        toast.error(getErrorMessage(deleteError, 'Could not remove bookmark.'));
        return;
      }
      setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(questionId); return s; });
      toast.success('Bookmark removed.');
    } else {
      setBookmarkQuestionId(questionId);
      setBookmarkNote('');
      setBookmarkDialogOpen(true);
    }
  }

  async function saveBookmark() {
    if (!bookmarkQuestionId) return;
    setSavingBookmark(true);
    const { error: bookmarkError } = await supabase.from('bookmarks').upsert(
      { user_id: profile!.id, question_id: bookmarkQuestionId, notes: bookmarkNote || null },
      { onConflict: 'user_id,question_id' }
    );
    if (bookmarkError) {
      toast.error(getErrorMessage(bookmarkError, 'Could not save bookmark.'));
      setSavingBookmark(false);
      return;
    }
    setBookmarkedIds((prev) => new Set(prev).add(bookmarkQuestionId));
    setSavingBookmark(false);
    setBookmarkDialogOpen(false);
    toast.success('Bookmark saved.');
  }

  async function submitReport() {
    if (!reportReason.trim()) return;
    setSavingReport(true);
    const { error: reportError } = await supabase.from('reported_questions').insert({
      user_id: profile!.id,
      question_id: reportQuestionId,
      reason: reportReason,
      description: reportDescription.trim() || null,
      status: 'pending' as const,
    });
    if (reportError) {
      toast.error(getErrorMessage(reportError, 'Could not submit report.'));
      setSavingReport(false);
      return;
    }
    setSavingReport(false);
    setReportDialogOpen(false);
    setReportReason('');
    setReportDescription('');
    toast.success('Report submitted.');
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="h-8 w-32 rounded-lg animate-shimmer" />
        <div className="h-40 rounded-xl animate-shimmer" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={loadResult} />;
  if (!attempt) return <ErrorState description="This result is not available." onRetry={loadResult} />;

  const scorePercent = getScorePercentage(attempt.score, attempt.total_marks);
  const accuracy = getAccuracy(attempt.correct_answers, attempt.total_questions);

  const stats = [
    { label: 'Score', value: `${attempt.score}/${attempt.total_marks}`, icon: Award, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { label: 'Correct', value: attempt.correct_answers, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Wrong', value: attempt.wrong_answers, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Skipped', value: attempt.skipped, icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    { label: 'Time', value: attempt.time_taken_seconds ? formatTime(attempt.time_taken_seconds) : '-', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-3">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/tests')} className="gap-1.5 -ml-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Tests
      </Button>

      {/* Score banner */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className={cn(
            'relative h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl',
            scorePercent >= 70 ? 'bg-green-500/10 text-green-600' : scorePercent >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'
          )}>
            {scorePercent}%
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle cx="32" cy="32" r="28" fill="none"
                stroke={scorePercent >= 70 ? '#22c55e' : scorePercent >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(scorePercent / 100) * 175.9} 175.9`}
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg)]">{attempt.source_name}</h2>
            <p className="text-xs text-[var(--fg-muted)]">{attempt.total_questions} questions - {attempt.total_marks} total marks</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-body)]">
              <div className={cn('h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0', s.bg)}>
                <s.icon className={cn('h-3.5 w-3.5', s.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--fg-muted)] leading-tight">{s.label}</p>
                <p className="text-sm font-bold text-[var(--fg)] leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2.5">
        {answers.map((ans, idx) => {
          const q = ans.question;
          if (!q) return null;
          const isCorrect = ans.is_correct;
          const isSkipped = !ans.selected_option_id;
          const marks = q.marks ?? 0;
          const negMarks = q.negative_marks ?? 0;

          return (
            <Card key={ans.id} className="!p-0 overflow-hidden">
              {/* Question header */}
              <div className={cn(
                'flex items-start gap-2.5 px-3.5 pt-3 pb-2',
                isSkipped ? '' : isCorrect ? 'border-l-3 border-l-green-500' : 'border-l-3 border-l-red-500'
              )}>
                <span className={cn(
                  'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                  isSkipped ? 'bg-gray-400/15 text-gray-400' : isCorrect ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-400'
                )}>
                  {idx + 1}
                </span>
                <p className="text-sm text-[var(--fg)] flex-1">{q.question_text}</p>
              </div>

              {/* Options */}
              <div className="px-3.5 pb-2 space-y-1.5">
                {q.options
                  ?.sort((a, b) => a.sort_order - b.sort_order)
                  .map((opt, optIdx) => {
                    const isSelected = ans.selected_option_id === opt.id;
                    const isRight = opt.is_correct;
                    const optLetter = String.fromCharCode(65 + optIdx);
                    return (
                      <div key={opt.id} className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        isRight ? 'bg-green-500/8 border border-green-500/20' : '',
                        isSelected && !isRight ? 'bg-red-500/8 border border-red-500/20' : '',
                        !isRight && !isSelected ? 'bg-[var(--bg-body)]' : ''
                      )}>
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            'mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-semibold',
                            isRight ? 'bg-green-500/20 text-green-600' : isSelected ? 'bg-red-500/20 text-red-500' : 'bg-[var(--border)] text-[var(--fg-muted)]'
                          )}>
                            {isRight ? <CheckCircle className="h-3 w-3" /> : isSelected ? <XCircle className="h-3 w-3" /> : optLetter}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-[var(--fg)]',
                              isRight && 'font-medium'
                            )}>{opt.option_text}</p>
                            {opt.explanation && (
                              <p className="text-[11px] text-[var(--fg-muted)] mt-1 leading-relaxed">{opt.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Question explanation */}
              {q.explanation && (
                <div className="mx-3.5 mb-2 px-3 py-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    <span className="font-semibold text-[var(--primary)]">Explanation: </span>
                    {q.explanation}
                  </p>
                </div>
              )}

              {/* Footer: marks left, bookmark/report right */}
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-body)]/50">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-green-600"><Plus className="h-3 w-3" />{marks} marks</span>
                  {negMarks > 0 && <span className="flex items-center gap-1 text-red-500"><Minus className="h-3 w-3" />-{negMarks}</span>}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => toggleBookmark(q.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                    title="Bookmark"
                    aria-label={bookmarkedIds.has(q.id) ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {bookmarkedIds.has(q.id) ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => { setReportQuestionId(q.id); setReportDialogOpen(true); }}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                    title="Report"
                    aria-label="Report question"
                  >
                    <Flag className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} title="Report Question">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--fg-muted)] mb-1.5 block">Select a reason</label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  aria-pressed={reportReason === reason}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                    reportReason === reason
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-medium'
                      : 'border-transparent hover:bg-[var(--bg-surface-hover)] text-[var(--fg-muted)]'
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Details (optional)"
            value={reportDescription}
            onChange={(event) => setReportDescription(event.target.value)}
            rows={3}
            placeholder="Add context that helps the admin verify the issue."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="secondary" size="sm" onClick={() => setReportDialogOpen(false)} disabled={savingReport}>Cancel</Button>
            <Button size="sm" onClick={submitReport} disabled={!reportReason || savingReport} loading={savingReport}>
              <Flag className="h-3.5 w-3.5" /> Submit Report
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bookmark Dialog */}
      <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen} title="Bookmark Question" description="Add a note to help you remember why you bookmarked this.">
        <div className="space-y-3">
          <textarea
            value={bookmarkNote}
            onChange={(e) => setBookmarkNote(e.target.value)}
            rows={3}
            placeholder="Add a note (optional)..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-body)] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all resize-none"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="secondary" size="sm" onClick={() => setBookmarkDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveBookmark} disabled={savingBookmark} loading={savingBookmark}>
              <Bookmark className="h-3.5 w-3.5" /> Save Bookmark
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
