import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/shared/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { cn, getScorePercentage, getAccuracy, formatDate, formatTime } from '../../lib/utils';
import {
  ClipboardList, Clock, Award, Play, CheckCircle, ChevronRight, History, Target, XCircle, BarChart3,
} from 'lucide-react';
import type { Test, TestAttempt } from '../../types/database';

const HISTORY_PER_PAGE = 8;

export default function TestListPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examTests, setExamTests] = useState<Test[]>([]);
  const [globalTests, setGlobalTests] = useState<Test[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    setPage('Tests', 'Take mock tests and review your history');
  }, [setPage]);

  useEffect(() => {
    loadTests();
    loadHistory(0);
  }, [profile]);

  async function loadTests() {
    setLoading(true);
    const promises: (Promise<unknown> | PromiseLike<unknown>)[] = [];

    if (profile?.exam_id) {
      promises.push(
        supabase
          .from('tests')
          .select('*, exam:exams(name)')
          .eq('exam_id', profile.exam_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .then(({ data }) => data && setExamTests(data))
      );
    }

    promises.push(
      supabase
        .from('tests')
        .select('*, exam:exams(name)')
        .eq('is_global', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .then(({ data }) => data && setGlobalTests(data))
    );

    await Promise.all(promises);
    setLoading(false);
  }

  async function loadHistory(page: number) {
    const from = page * HISTORY_PER_PAGE;
    const to = from + HISTORY_PER_PAGE - 1;
    const { data, count } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact' })
      .eq('user_id', profile!.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .range(from, to);
    if (data) setHistory(data);
    if (count != null) setHistoryTotal(count);
    setHistoryPage(page);
  }

  async function startTest(test: Test) {
    const { data: existing } = await supabase
      .from('test_attempts')
      .select('id')
      .eq('user_id', profile!.id)
      .eq('test_id', test.id)
      .eq('status', 'completed')
      .limit(1);

    if (existing && existing.length > 0 && !test.allow_multiple_attempts) {
      setCompletedTestIds((prev) => new Set(prev).add(test.id));
      return;
    }

    const { data: tqs } = await supabase
      .from('test_questions')
      .select('question_id')
      .eq('test_id', test.id)
      .order('sort_order');

    const questionIds = tqs?.map((q) => q.question_id) ?? [];
    if (questionIds.length === 0) {
      window.alert('This test does not have questions assigned yet.');
      return;
    }

    const attemptQuestionIds = test.shuffle_questions
      ? [...questionIds].sort(() => Math.random() - 0.5)
      : questionIds;

    const { data: attempt } = await supabase
      .from('test_attempts')
      .insert({
        user_id: profile!.id,
        test_id: test.id,
        source_type: 'test' as const,
        source_id: test.id,
        source_name: test.title,
        total_questions: attemptQuestionIds.length,
        total_marks: test.total_marks,
        duration_minutes: test.duration_minutes,
        status: 'in_progress' as const,
      })
      .select()
      .single();

    if (attempt) {
      await supabase.from('user_answers').insert(
        attemptQuestionIds.map((qid) => ({
          attempt_id: attempt.id,
          question_id: qid,
          time_spent_seconds: 0,
        }))
      );
      navigate(`/test/${attempt.id}`);
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-10 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
      <div className="h-8 rounded-lg animate-shimmer w-1/3 mt-4" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    </div>
  );

  function getAvailability(test: Test) {
    const now = Date.now();
    const opensAt = test.scheduled_at ? new Date(test.scheduled_at).getTime() : null;
    const closesAt = test.scheduled_end_at ? new Date(test.scheduled_end_at).getTime() : null;

    if (opensAt && now < opensAt) {
      return { available: false, label: `Opens ${formatDate(test.scheduled_at!)}` };
    }
    if (closesAt && now > closesAt) {
      return { available: false, label: 'Closed' };
    }
    return { available: true, label: 'Start' };
  }

  const renderTestCard = (test: Test) => {
    const isCompleted = completedTestIds.has(test.id);
    const availability = getAvailability(test);
    return (
      <Card key={test.id} className="hover:border-[var(--border-strong)] transition-all duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--fg)] truncate">{test.title}</p>
            {test.exam?.name && <Badge variant="default" className="mt-1">{test.exam.name}</Badge>}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)]"><Clock className="h-3 w-3" />{test.duration_minutes} min</span>
              <span className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)]"><Award className="h-3 w-3" />{test.total_marks} marks</span>
            </div>
          </div>
          {isCompleted ? (
            <Badge variant="success"><CheckCircle className="h-3 w-3 mr-0.5" />Done</Badge>
          ) : (
            <Button size="sm" onClick={() => startTest(test)} disabled={!availability.available}>
              <Play className="h-3.5 w-3.5" /> {availability.label}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Available Tests tabs — exam vs global */}
      <Tabs
        items={[
          {
            value: 'exam',
            label: `My Exam (${examTests.length})`,
            content:
              examTests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examTests.map(renderTestCard)}
                </div>
              ) : (
                <EmptyState icon={ClipboardList} title="No tests available" description="Tests for your exam will appear here." />
              ),
          },
          {
            value: 'global',
            label: `Global (${globalTests.length})`,
            content:
              globalTests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {globalTests.map(renderTestCard)}
                </div>
              ) : (
                <EmptyState icon={ClipboardList} title="No global tests" description="Global tests open to all students will appear here." />
              ),
          },
        ]}
      />

      {/* Test History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-[var(--fg-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--fg)]">Test History</h2>
          <Badge variant="default">{historyTotal}</Badge>
        </div>

        {history.length > 0 ? (
          <>
            <div className="space-y-2">
              {history.map((att) => {
                const scorePct = getScorePercentage(att.score, att.total_marks);
                const acc = getAccuracy(att.correct_answers, att.total_questions);
                return (
                  <div
                    key={att.id}
                    onClick={() => navigate(`/result/${att.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 cursor-pointer group"
                  >
                    {/* Score circle */}
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                      scorePct >= 70 ? 'bg-green-500/10 text-green-600' : scorePct >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'
                    )}>
                      {scorePct}%
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--fg)] truncate group-hover:text-[var(--primary)] transition-colors">{att.source_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-[var(--fg-muted)]">{att.completed_at ? formatDate(att.completed_at) : '—'}</span>
                        <span className="flex items-center gap-0.5 text-[11px] text-[var(--fg-muted)]"><Clock className="h-2.5 w-2.5" />{att.time_taken_seconds ? formatTime(att.time_taken_seconds) : '—'}</span>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-[11px] flex-shrink-0">
                      <span className="flex items-center gap-1 text-[var(--fg-muted)]"><Target className="h-3 w-3" />{acc}%</span>
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" />{att.correct_answers}</span>
                      <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" />{att.wrong_answers}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--fg-subtle)] group-hover:text-[var(--fg-muted)] transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>

            <Pagination
              className="mt-3"
              page={historyPage}
              pageSize={HISTORY_PER_PAGE}
              total={historyTotal}
              onPageChange={loadHistory}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-8 w-8 text-[var(--fg-muted)]/30 mx-auto mb-2" />
            <p className="text-sm text-[var(--fg-muted)]">No test history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
