import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { StatsCard } from '../../components/shared/StatsCard';
import { ErrorState } from '../../components/shared/ErrorState';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { DIFFICULTY_COLORS } from '../../lib/constants';
import { getErrorMessage } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import {
  Users, BookOpen, FileText, ClipboardList, Activity,
  ArrowRight, AlertTriangle,
} from 'lucide-react';

const AdminDailyAttemptsChart = lazy(() =>
  import('../../components/charts/DashboardCharts').then((module) => ({ default: module.AdminDailyAttemptsChart }))
);
const AdminDifficultyChart = lazy(() =>
  import('../../components/charts/DashboardCharts').then((module) => ({ default: module.AdminDifficultyChart }))
);

function ChartFallback({ className = 'h-full' }: { className?: string }) {
  return <div className={`${className} rounded-lg animate-shimmer`} />;
}

interface RecentAttempt {
  id: string;
  source_name: string;
  score: number;
  total_marks: number;
  completed_at: string | null;
  profile: { full_name: string } | null;
}

export default function DashboardPage() {
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ users: 0, exams: 0, questions: 0, tests: 0, attempts: 0 });
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [reportedCount, setReportedCount] = useState(0);
  const [difficultyData, setDifficultyData] = useState<{ name: string; count: number }[]>([]);
  const [dailyAttempts, setDailyAttempts] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    setPage('Dashboard', 'Admin overview');
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      const dayWindows = Array.from({ length: 7 }, (_, index) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (6 - index));
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return {
          date: start.toLocaleDateString('en-US', { weekday: 'short' }),
          start: start.toISOString(),
          end: end.toISOString(),
        };
      });

      const [usersRes, examsRes, questionsRes, testsRes, attemptsRes, recentRes, reportRes, ...metricRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('id, source_name, score, total_marks, completed_at, profile:profiles!user_id(full_name)').eq('status', 'completed').order('completed_at', { ascending: false }).limit(5),
        supabase.from('reported_questions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ...difficulties.map((difficulty) => supabase.from('questions').select('id', { count: 'exact', head: true }).eq('difficulty', difficulty)),
        ...dayWindows.map((day) =>
          supabase
            .from('test_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('completed_at', day.start)
            .lt('completed_at', day.end)
        ),
      ]);

      [usersRes, examsRes, questionsRes, testsRes, attemptsRes, recentRes, reportRes, ...metricRes].forEach((res) => {
        if (res.error) throw res.error;
      });

      setStats({
        users: usersRes.count || 0,
        exams: examsRes.count || 0,
        questions: questionsRes.count || 0,
        tests: testsRes.count || 0,
        attempts: attemptsRes.count || 0,
      });

      if (recentRes.data) setRecentAttempts(recentRes.data as unknown as RecentAttempt[]);
      setReportedCount(reportRes.count || 0);

      const difficultyResults = metricRes.slice(0, difficulties.length);
      setDifficultyData(
        difficulties
          .map((name, index) => ({ name, count: difficultyResults[index]?.count || 0 }))
          .filter((item) => item.count > 0)
      );

      const dailyResults = metricRes.slice(difficulties.length);
      setDailyAttempts(dayWindows.map((day, index) => ({ date: day.date, count: dailyResults[index]?.count || 0 })));
    } catch (err) { setError(getErrorMessage(err, 'Unable to load admin dashboard.')); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-12 rounded-lg animate-shimmer w-2/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-xl animate-shimmer" />
          <div className="h-64 rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={loadStats} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">Welcome back - here's your platform overview.</p>
        </div>
        {reportedCount > 0 && (
          <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/15 transition-colors">
            <AlertTriangle className="h-3.5 w-3.5" /> {reportedCount} pending reports
          </button>
        )}
      </div>

      <section>
        <h2 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">Platform Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard icon={Users} title="Users" value={stats.users} />
          <StatsCard icon={BookOpen} title="Exams" value={stats.exams} />
          <StatsCard icon={FileText} title="Questions" value={stats.questions} />
          <StatsCard icon={ClipboardList} title="Tests" value={stats.tests} />
          <StatsCard icon={Activity} title="Attempts" value={stats.attempts} />
        </div>
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Attempts */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily Attempts (Last 7 Days)</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Test submissions per day</p>
            </div>
          </CardHeader>
          {dailyAttempts.length > 0 ? (
            <div className="h-48">
              <Suspense fallback={<ChartFallback />}>
                <AdminDailyAttemptsChart data={dailyAttempts} />
              </Suspense>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-[var(--fg-muted)]">No data yet</p>
            </div>
          )}
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Question Difficulty</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Distribution across all questions</p>
            </div>
          </CardHeader>
          {difficultyData.length > 0 ? (
            <>
              <div className="h-40 flex items-center justify-center">
                <Suspense fallback={<ChartFallback />}>
                  <AdminDifficultyChart data={difficultyData} />
                </Suspense>
              </div>
              <div className="flex justify-center gap-4 pt-2 border-t border-[var(--border)]">
                {difficultyData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[d.name] || '#3a9cc0' }} />
                    <span className="text-[11px] text-[var(--fg-muted)] capitalize">{d.name} <span className="text-[var(--fg)] font-medium">({d.count})</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-[var(--fg-muted)]">No questions yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Recent Submissions</h2>
            <button onClick={() => navigate('/admin/users')} className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <Card className="!p-0 divide-y divide-[var(--border)]">
            {recentAttempts.map((a) => {
              const pct = a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0', pct >= 70 ? 'bg-green-500/10 text-green-600' : pct >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500')}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{a.source_name}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">{a.profile?.full_name || 'Unknown'} - {a.score}/{a.total_marks}</p>
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)] flex-shrink-0">{a.completed_at ? formatDate(a.completed_at) : ''}</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
