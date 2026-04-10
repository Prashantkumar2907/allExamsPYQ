import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/shared/EmptyState';
import { cn } from '../../lib/utils';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_score: number;
  tests_taken: number;
  total_correct: number;
  total_questions: number;
  profile: { full_name: string; avatar_url: string | null } | null;
}

export default function LeaderboardPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setPage('Leaderboard', 'See top performers');
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    if (!profile?.exam_id) { setLoading(false); return; }
    const { data } = await supabase
      .from('leaderboard_scores')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('exam_id', profile.exam_id)
      .order('total_score', { ascending: false })
      .limit(50);
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  }

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="h-8 w-1/2 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
      <div className="space-y-0">
        {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 40}ms` }} />)}
      </div>
    </div>
  );
  if (!entries.length) {
    return <EmptyState icon={Trophy} title="No rankings yet" description="Complete tests to appear on the leaderboard." />;
  }

  const userRank = entries.findIndex((e) => e.user_id === profile?.id) + 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Leaderboard</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">See how you rank against others</p>
        </div>
        {userRank > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-[var(--fg-muted)]">Your rank</p>
            <p className="text-lg font-bold text-[var(--primary)]">#{userRank}</p>
          </div>
        )}
      </div>

      {/* Podium - Top 3 */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[entries[1], entries[0], entries[2]].map((e, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['min-h-[120px]', 'min-h-[150px]', 'min-h-[100px]'];
            const icons = [Medal, Crown, Medal];
            const Icon = icons[i];
            const iconColors = ['text-gray-400', 'text-yellow-500', 'text-amber-600'];
            const isUser = e.user_id === profile?.id;
            return (
              <Card
                key={e.id}
                className={cn(
                  'flex flex-col items-center justify-end text-center pb-3',
                  rank === 1 && 'ring-2 ring-[var(--primary)]/30 bg-gradient-to-b from-[var(--primary)]/5 to-transparent',
                  isUser && 'ring-2 ring-[var(--primary)]/40',
                  heights[i]
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center mb-2',
                  rank === 1 ? 'bg-yellow-500/15' : rank === 2 ? 'bg-gray-400/15' : 'bg-amber-600/15'
                )}>
                  <Icon className={cn('h-5 w-5', iconColors[i])} />
                </div>
                <Avatar name={e.profile?.full_name || 'U'} src={e.profile?.avatar_url || undefined} size="md" />
                <p className="text-xs font-semibold text-[var(--fg)] mt-2 truncate max-w-full px-2">
                  {e.profile?.full_name || 'Anonymous'}
                </p>
                <p className="text-lg font-bold text-[var(--primary)] mt-0.5">{e.total_score}</p>
                <p className="text-[10px] text-[var(--fg-muted)]">{e.tests_taken} tests</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <Card className="divide-y divide-[var(--border)] !p-0 overflow-hidden">
        {entries.map((e, i) => {
          const rank = i + 1;
          const isUser = e.user_id === profile?.id;
          const accuracy = e.total_questions
            ? Math.round((e.total_correct / e.total_questions) * 100)
            : 0;

          return (
            <div
              key={e.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isUser && 'bg-[var(--primary)]/8',
                !isUser && i % 2 === 1 && 'bg-[var(--bg-body)]/50'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  rank <= 3 ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'text-[var(--fg-muted)]'
                )}
              >
                {rank}
              </span>
              <Avatar name={e.profile?.full_name || 'U'} src={e.profile?.avatar_url || undefined} size="sm" />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', isUser ? 'text-[var(--primary)]' : 'text-[var(--fg)]')}>
                  {e.profile?.full_name || 'Anonymous'}
                  {isUser && <span className="ml-1.5 text-[10px] font-normal text-[var(--fg-muted)]">(You)</span>}
                </p>
                <p className="text-[11px] text-[var(--fg-muted)]">{e.tests_taken} tests · {accuracy}% accuracy</p>
              </div>
              <span className="text-sm font-bold text-[var(--fg)]">{e.total_score}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
