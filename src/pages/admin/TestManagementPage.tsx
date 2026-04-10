import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Pencil, Trash2, ClipboardList, Globe, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Exam } from '../../types/database';

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  exam_id: string;
  is_global: boolean;
  duration_minutes: number;
  total_marks: number;
  shuffle_questions: boolean;
  allow_multiple_attempts: boolean;
  instructions: string | null;
  status: 'draft' | 'active' | 'archived';
  scheduled_at: string | null;
  scheduled_end_at: string | null;
  created_at: string;
  exam?: { name: string };
}

export default function TestManagementPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState<TestItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    exam_id: '',
    is_global: false,
    duration_minutes: 60,
    total_marks: 100,
    shuffle_questions: false,
    allow_multiple_attempts: false,
    instructions: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    scheduled_at: '',
    scheduled_end_at: '',
  });

  useEffect(() => { setPage('Tests', 'Create and manage tests'); loadData(); }, []);

  async function loadData() {
    const [testsRes, examsRes] = await Promise.all([
      supabase.from('tests').select('*, exam:exams(name)').order('created_at', { ascending: false }),
      supabase.from('exams').select('*').order('name'),
    ]);
    if (testsRes.data) setTests(testsRes.data as TestItem[]);
    if (examsRes.data) setExams(examsRes.data);
    setLoading(false);
  }

  function openCreate() {
    setEditTest(null);
    setForm({
      title: '', description: '', exam_id: '', is_global: false,
      duration_minutes: 60, total_marks: 100, shuffle_questions: false,
      allow_multiple_attempts: false, instructions: '', status: 'draft',
      scheduled_at: '', scheduled_end_at: '',
    });
    setDialogOpen(true);
  }

  function openEdit(t: TestItem) {
    setEditTest(t);
    setForm({
      title: t.title,
      description: t.description || '',
      exam_id: t.exam_id,
      is_global: t.is_global,
      duration_minutes: t.duration_minutes,
      total_marks: t.total_marks,
      shuffle_questions: t.shuffle_questions,
      allow_multiple_attempts: t.allow_multiple_attempts,
      instructions: t.instructions || '',
      status: t.status as 'draft' | 'active' | 'archived',
      scheduled_at: t.scheduled_at ? t.scheduled_at.slice(0, 16) : '',
      scheduled_end_at: t.scheduled_end_at ? t.scheduled_end_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const payload: any = {
      title: form.title,
      description: form.description || null,
      exam_id: form.exam_id || null,
      is_global: form.is_global,
      duration_minutes: form.duration_minutes,
      total_marks: form.total_marks,
      shuffle_questions: form.shuffle_questions,
      allow_multiple_attempts: form.allow_multiple_attempts,
      instructions: form.instructions || null,
      status: form.status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      scheduled_end_at: form.scheduled_end_at ? new Date(form.scheduled_end_at).toISOString() : null,
    };

    if (editTest) {
      await supabase.from('tests').update(payload).eq('id', editTest.id);
    } else {
      await supabase.from('tests').insert(payload);
    }
    setDialogOpen(false);
    loadData();
  }

  async function deleteTest(id: string) {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    loadData();
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }

  const statusColors = {
    draft: 'muted' as const,
    active: 'success' as const,
    archived: 'warning' as const,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--fg)]">Tests</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Create Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tests yet" description="Create your first test to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <Card key={t.id} className="group hover:-translate-y-[1px] hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--fg)] truncate">{t.title}</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">{t.exam?.name || 'No exam'}</p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(t)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-[var(--primary)] cursor-pointer">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteTest(t.id)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-red-400 cursor-pointer">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge dot variant={statusColors[t.status]}>{t.status}</Badge>
                {t.is_global && <Badge><Globe className="h-2.5 w-2.5 mr-0.5" /> Global</Badge>}
                <span className="text-[10px] text-[var(--fg-muted)]">{t.duration_minutes}m · {t.total_marks} marks</span>
              </div>
              {t.scheduled_at && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--fg-muted)]">
                  <Calendar className="h-2.5 w-2.5" /> {formatDate(t.scheduled_at)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editTest ? 'Edit Test' : 'Create Test'}>
        <div className="space-y-4 max-h-[70dvh] overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Basic Information</p>
          <Input id="t-title" label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="block text-xs font-medium text-[var(--fg)] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--fg)] mb-1">Exam</label>
              <select value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: e.target.value })} className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
                <option value="">Select exam</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--fg)] mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input id="t-dur" label="Duration (min)" type="number" value={String(form.duration_minutes)} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            <Input id="t-marks" label="Total Marks" type="number" value={String(form.total_marks)} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} />
          </div>

          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider pt-1">Schedule & Options</p>
          <div className="grid grid-cols-2 gap-2">
            <Input id="t-start" label="Scheduled Start" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            <Input id="t-end" label="Scheduled End" type="datetime-local" value={form.scheduled_end_at} onChange={(e) => setForm({ ...form, scheduled_end_at: e.target.value })} />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={form.is_global} onChange={(e) => setForm({ ...form, is_global: e.target.checked })} className="rounded border-[var(--border)] cursor-pointer" />
              Global test
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={form.shuffle_questions} onChange={(e) => setForm({ ...form, shuffle_questions: e.target.checked })} className="rounded border-[var(--border)] cursor-pointer" />
              Shuffle
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={form.allow_multiple_attempts} onChange={(e) => setForm({ ...form, allow_multiple_attempts: e.target.checked })} className="rounded border-[var(--border)] cursor-pointer" />
              Multiple attempts
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.title.trim()}>
              {editTest ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
