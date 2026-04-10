import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/shared/StatsCard';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn, getAccuracy, getScorePercentage, formatDate, formatTime } from '../../lib/utils';
import { CHART_COLORS } from '../../lib/constants';
import {
  ClipboardCheck,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle,
  History,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { TestAttempt, SyllabusProgress } from '../../types/database';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [nextTest, setNextTest] = useState<{ title: string; scheduled_at: string } | null>(null);

  useEffect(() => {
    setPage('Dashboard', '');
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
    const [attRes, sylRes, topRes, testRes] = await Promise.all([
      supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', profile!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }),
      supabase
        .from('syllabus_progress')
        .select('topic_id, is_completed')
        .eq('user_id', profile!.id),
      profile!.exam_id
        ? supabase
            .from('topics')
            .select('id', { count: 'exact', head: true })
            .eq('chapters.subjects.exam_id', profile!.exam_id)
        : Promise.resolve({ data: null, count: 0 }),
      supabase
        .from('tests')
        .select('title, scheduled_at')
        .eq('status', 'active')
        .not('scheduled_at', 'is', null)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(1),
    ]);

    if (attRes.data) setAttempts(attRes.data);
    if (sylRes.data) setSyllabusProgress(sylRes.data as SyllabusProgress[]);
    if (topRes.count != null) setTotalTopics(topRes.count);
    if (testRes.data?.[0]) setNextTest(testRes.data[0] as { title: string; scheduled_at: string });
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-24 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 rounded-xl animate-shimmer" />
          <div className="h-64 rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  const totalTests = attempts.length;
  const avgScore = totalTests
    ? Math.round(attempts.reduce((a, b) => a + getScorePercentage(b.score, b.total_marks), 0) / totalTests)
    : 0;
  const avgAccuracy = totalTests
    ? Math.round(
        attempts.reduce((a, b) => a + getAccuracy(b.correct_answers, b.total_questions), 0) / totalTests
      )
    : 0;
  const completedTopics = syllabusProgress.filter((s) => s.is_completed).length;
  const syllabusPercent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Trend data (last 10 attempts)
  const trendData = attempts
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({
      name: `#${i + 1}`,
      score: getScorePercentage(a.score, a.total_marks),
      accuracy: getAccuracy(a.correct_answers, a.total_questions),
    }));

  // Question status aggregate
  const totalCorrect = attempts.reduce((a, b) => a + b.correct_answers, 0);
  const totalWrong = attempts.reduce((a, b) => a + b.wrong_answers, 0);
  const totalSkipped = attempts.reduce((a, b) => a + b.skipped, 0);
  const pieData = [
    { name: 'Correct', value: totalCorrect },
    { name: 'Wrong', value: totalWrong },
    { name: 'Skipped', value: totalSkipped },
  ].filter((d) => d.value > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 stagger-children">
      {/* Welcome Hero */}
      <div className="relative rounded-xl bg-gradient-to-br from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent border border-[var(--primary)]/15 p-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--fg)]">
                {greeting}, {profile?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-[var(--fg-muted)] mt-1">
                {nextTest
                  ? `Next up: ${nextTest.title} on ${formatDate(nextTest.scheduled_at)}`
                  : 'Keep up the momentum — consistency is key!'}
              </p>
            </div>
            {profile?.exam?.name && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] px-2.5 py-1 text-xs font-medium flex-shrink-0">
                <BookOpen className="h-3.5 w-3.5" />
                {profile.exam.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">Your Progress</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Tests Taken" value={totalTests} icon={ClipboardCheck} />
          <StatsCard title="Avg Score" value={`${avgScore}%`} icon={TrendingUp} />
          <StatsCard title="Accuracy" value={`${avgAccuracy}%`} icon={Target} />
          <StatsCard title="Syllabus" value={`${syllabusPercent}%`} icon={CheckCircle} />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Performance Trend</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Score & accuracy over your last 10 tests</p>
            </div>
          </CardHeader>
          {trendData.length > 1 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke={CHART_COLORS[0]} fill="url(#scoreFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="accuracy" stroke={CHART_COLORS[2]} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-8 w-8 text-[var(--fg-muted)]/30 mb-2" />
              <p className="text-xs text-[var(--fg-muted)]">Take more tests to see trends</p>
            </div>
          )}
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Question Status</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Aggregate across all tests</p>
            </div>
          </CardHeader>
          {pieData.length > 0 ? (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={[CHART_COLORS[0], '#d45a5a', CHART_COLORS[3]][i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-8 w-8 text-[var(--fg-muted)]/30 mb-2" />
              <p className="text-xs text-[var(--fg-muted)]">No data yet</p>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-[var(--border)]">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: [CHART_COLORS[0], '#d45a5a', CHART_COLORS[3]][i] }} />
                <span className="text-[11px] text-[var(--fg-muted)] font-medium">{d.name} <span className="text-[var(--fg)]">({d.value})</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tests */}
      {attempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Recent Tests</p>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/tests')}>
              View All
            </Button>
          </div>
          <Card className="!p-0 divide-y divide-[var(--border)]">
            {attempts.slice(0, 5).map((a) => {
              const sp = getScorePercentage(a.score, a.total_marks);
              const acc = getAccuracy(a.correct_answers, a.total_questions);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                  onClick={() => navigate(`/result/${a.id}`)}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    sp >= 70 ? 'bg-green-500/10 text-green-600' : sp >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'
                  )}>{sp}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{a.source_name}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      {a.correct_answers}✓ · {a.wrong_answers}✗ · {acc}% acc
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)] flex-shrink-0">{formatDate(a.completed_at ?? a.started_at)}</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nextTest && (
            <Card className="group cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--fg)] truncate">{nextTest.title}</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">{formatDate(nextTest.scheduled_at)}</p>
                </div>
              </div>
            </Card>
          )}
          <Card
            className="group cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200"
            onClick={() => navigate('/exams')}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg)]">Browse Exams</p>
                <p className="text-[11px] text-[var(--fg-muted)]">Explore subjects & topics</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
          <Card
            className="group cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200"
            onClick={() => navigate('/tests')}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg)]">Take a Test</p>
                <p className="text-[11px] text-[var(--fg-muted)]">Start a practice or mock test</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
