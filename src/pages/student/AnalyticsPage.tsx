import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { CHART_COLORS } from '../../lib/constants';
import { getErrorMessage } from '../../lib/api';
import { getAccuracy } from '../../lib/utils';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { TestAttempt } from '../../types/database';

const tooltipStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    setPage('Analytics', 'Track your performance');
  }, [setPage]);

  useEffect(() => {
    if (!profile) return;
    loadAttempts();
  }, [profile]);

  async function loadAttempts() {
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: attemptsError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true });
      if (attemptsError) throw attemptsError;
      setAttempts(data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load analytics.'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="h-8 w-1/3 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    </div>
  );
  if (error) return <ErrorState description={error} onRetry={loadAttempts} />;
  if (!attempts.length) {
    return <EmptyState icon={BarChart3} title="No analytics yet" description="Complete tests to see your performance analytics." />;
  }

  // Tests over time (monthly)
  const monthlyMap = new Map<string, number>();
  attempts.forEach((a) => {
    const d = new Date(a.completed_at!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  });
  const monthlyData = [...monthlyMap.entries()].map(([month, count]) => ({ month, count }));

  // Accuracy trend (per test)
  const accuracyData = attempts.map((a, i) => ({
    test: i + 1,
    accuracy: Math.round(getAccuracy(a.correct_answers, a.total_questions)),
    score: Math.round((a.score / a.total_marks) * 100),
  }));

  // Score distribution
  const scoreBuckets = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ];
  attempts.forEach((a) => {
    const pct = Math.round((a.score / a.total_marks) * 100);
    const idx = Math.min(Math.floor(pct / 20), 4);
    if (idx >= 0) scoreBuckets[idx].count++;
  });

  // Difficulty analysis
  const difficultyData = [
    { name: 'Easy', attempted: 0, correct: 0 },
    { name: 'Medium', attempted: 0, correct: 0 },
    { name: 'Hard', attempted: 0, correct: 0 },
  ];
  // We approximate from attempts; real data would join user_answers with questions.
  const totalCorrect = attempts.reduce((s, a) => s + a.correct_answers, 0);
  const totalQ = attempts.reduce((s, a) => s + a.total_questions, 0);
  const avgAcc = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  // Question status donut (aggregate)
  const totalWrong = attempts.reduce((s, a) => s + a.wrong_answers, 0);
  const totalSkipped = attempts.reduce((s, a) => s + a.skipped, 0);
  const donutData = [
    { name: 'Correct', value: totalCorrect },
    { name: 'Wrong', value: totalWrong },
    { name: 'Skipped', value: totalSkipped },
  ].filter((d) => d.value > 0);
  const donutColors = [CHART_COLORS[0], '#d45a5a', CHART_COLORS[3]];

  // Summary stats
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total_marks) * 100, 0) / attempts.length)
    : 0;
  const bestScore = Math.round(
    Math.max(...attempts.map((a) => (a.score / a.total_marks) * 100))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[var(--fg)]">Analytics</h1>
        <p className="text-sm text-[var(--fg-muted)] mt-0.5">Track your preparation progress</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tests Taken', value: attempts.length },
          { label: 'Avg Score', value: `${avgScore}%` },
          { label: 'Best Score', value: `${bestScore}%` },
          { label: 'Accuracy', value: `${avgAcc}%` },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <p className="text-[11px] text-[var(--fg-muted)] font-medium">{s.label}</p>
            <p className="text-xl font-bold text-[var(--primary)] mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tests Over Time */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tests Over Time</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Monthly test completion count</p>
            </div>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Accuracy Trend */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Accuracy & Score Trend</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Per-test accuracy and score %</p>
            </div>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="test" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} label={{ value: 'Test #', fontSize: 10, fill: 'var(--fg-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accuracy" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="score" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5"><div className="h-0.5 w-5 rounded" style={{ backgroundColor: CHART_COLORS[0] }} /><span className="text-[11px] text-[var(--fg-muted)]">Accuracy</span></div>
            <div className="flex items-center gap-1.5"><div className="h-0.5 w-5 rounded border-dashed border-t-2" style={{ borderColor: CHART_COLORS[2] }} /><span className="text-[11px] text-[var(--fg-muted)]">Score</span></div>
          </div>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Score Distribution</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">How your scores are distributed</p>
            </div>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreBuckets.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Question Status Donut */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Overall Question Status</CardTitle>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Correct, wrong, and skipped breakdown</p>
            </div>
          </CardHeader>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-[var(--border)]">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: donutColors[i] }} />
                <span className="text-[11px] text-[var(--fg-muted)] font-medium">{d.name} <span className="text-[var(--fg)]">({d.value})</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
