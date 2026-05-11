import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import { Flag, CheckCircle, XCircle } from 'lucide-react';

interface ReportItem {
  id: string;
  question_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  question: { question_text: string } | null;
  profile: { full_name: string; email: string } | null;
}

export default function ReportedQuestionsPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    setPage('Reported Questions', 'Review flagged questions');
    void loadReports();
  }, []);

  async function loadReports(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const { data, error: reportsError } = await supabase
        .from('reported_questions')
        .select('*, question:questions(question_text), profile:profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (reportsError) throw reportsError;
      setReports((data || []) as ReportItem[]);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load reported questions.'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function updateStatus(id: string, status: 'resolved' | 'dismissed') {
    setUpdatingId(id);
    try {
      const { error: updateError } = await supabase.from('reported_questions').update({
        status,
        admin_notes: adminNotes[id] || null,
        resolved_at: new Date().toISOString(),
      }).eq('id', id);
      if (updateError) throw updateError;
      toast.success(status === 'resolved' ? 'Report resolved.' : 'Report dismissed.');
      await loadReports(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update this report.'));
    } finally {
      setUpdatingId('');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={() => loadReports()} />;

  const pending = reports.filter((r) => r.status === 'pending' || r.status === 'reviewed');
  const resolved = reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed');

  const statusColors = {
    pending: 'warning' as const,
    reviewed: 'default' as const,
    resolved: 'success' as const,
    dismissed: 'muted' as const,
  };

  function renderReport(r: ReportItem) {
    const isPending = r.status === 'pending' || r.status === 'reviewed';
    return (
      <div key={r.id} className={cn('p-3 rounded-lg bg-[var(--bg-body)] transition', isPending ? 'border-l-2 border-l-amber-400' : 'opacity-75')}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)] line-clamp-2">
              {r.question?.question_text || 'Question deleted'}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--fg-muted)]">
              <span className="font-medium text-[var(--fg)]">{r.profile?.full_name || 'Unknown'}</span>
                    <span>-</span>
              <span>{formatDate(r.created_at)}</span>
            </div>
          </div>
          <Badge variant={statusColors[r.status]}>{r.status}</Badge>
        </div>
        <p className="text-[10px] text-[var(--fg-muted)] bg-[var(--bg-surface)] rounded px-2 py-1 mt-1">
          <span className="font-medium">Reason:</span> {r.reason}
        </p>
        {r.description && (
          <p className="text-[10px] text-[var(--fg-muted)] bg-[var(--bg-surface)] rounded px-2 py-1 mt-1">
            <span className="font-medium">Details:</span> {r.description}
          </p>
        )}
        <div className="mt-2">
          <Link
            to={`/admin/questions?question=${r.question_id}`}
            className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[11px] font-medium text-[var(--fg)] shadow-xs transition hover:border-[#B0BEC5] hover:bg-[var(--bg-surface-hover)] focus-ring"
          >
            Edit question
          </Link>
        </div>
        {isPending && (
          <div className="mt-2 space-y-1.5">
            <Input
              label="Admin notes"
              value={adminNotes[r.id] || ''}
              onChange={(e) => setAdminNotes({ ...adminNotes, [r.id]: e.target.value })}
              placeholder="Optional resolution note"
              className="h-8 text-[11px]"
            />
            <div className="flex gap-2">
              <Button size="sm" className="bg-[var(--success)] hover:bg-[var(--success)]/90 text-white" onClick={() => updateStatus(r.id, 'resolved')} loading={updatingId === r.id}>
                <CheckCircle className="h-3 w-3 mr-1" /> Resolve
              </Button>
              <Button size="sm" variant="secondary" className="hover:bg-red-500/10 hover:text-red-500" onClick={() => updateStatus(r.id, 'dismissed')} disabled={updatingId === r.id}>
                <XCircle className="h-3 w-3 mr-1" /> Dismiss
              </Button>
            </div>
          </div>
        )}
        {r.admin_notes && !isPending && (
          <p className="text-[10px] text-[var(--fg-muted)] mt-1 italic">
            <span className="font-medium">Admin:</span> {r.admin_notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--fg)]">Reported Questions</h1>

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports" description="No questions have been reported yet." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-t-2 border-t-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Pending <Badge variant="warning">{pending.length}</Badge></CardTitle>
            </CardHeader>
            {pending.length === 0 ? (
              <p className="text-[10px] text-[var(--fg-muted)] text-center py-4">All caught up!</p>
            ) : (
              <div className="space-y-2 max-h-[calc(100dvh-14rem)] overflow-y-auto">
                {pending.map(renderReport)}
              </div>
            )}
          </Card>

          <Card className="border-t-2 border-t-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Resolved <Badge variant="success">{resolved.length}</Badge></CardTitle>
            </CardHeader>
            {resolved.length === 0 ? (
              <p className="text-[10px] text-[var(--fg-muted)] text-center py-4">No resolved reports</p>
            ) : (
              <div className="space-y-2 max-h-[calc(100dvh-14rem)] overflow-y-auto">
                {resolved.map(renderReport)}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
