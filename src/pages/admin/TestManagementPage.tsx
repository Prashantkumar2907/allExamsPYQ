import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage, normalizeText } from '../../lib/api';
import { Plus, Pencil, Trash2, ClipboardList, Globe, Calendar, ListPlus, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Exam, Subject, Chapter, Topic, Difficulty, TestStatus } from '../../types/database';

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  exam_id: string | null;
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

interface QuestionPickerItem {
  id: string;
  question_text: string;
  difficulty: Difficulty;
  marks: number;
  year: number | null;
}

interface AssignedQuestionItem {
  id: string;
  question_id: string;
  sort_order: number;
  question: QuestionPickerItem | null;
}

export default function TestManagementPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState<TestItem | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionTest, setQuestionTest] = useState<TestItem | null>(null);
  const [deleteTestId, setDeleteTestId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [assignedQuestions, setAssignedQuestions] = useState<AssignedQuestionItem[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionPickerItem[]>([]);
  const [assigningQuestionId, setAssigningQuestionId] = useState('');
  const [questionExamId, setQuestionExamId] = useState('');
  const [questionSubjectId, setQuestionSubjectId] = useState('');
  const [questionChapterId, setQuestionChapterId] = useState('');
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);

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
    status: 'draft' as TestStatus,
    scheduled_at: '',
    scheduled_end_at: '',
  });

  useEffect(() => { setPage('Tests', 'Create and manage tests'); loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [testsRes, examsRes] = await Promise.all([
        supabase.from('tests').select('*, exam:exams(name)').order('created_at', { ascending: false }),
        supabase.from('exams').select('*').order('name'),
      ]);
      if (testsRes.error) throw testsRes.error;
      if (examsRes.error) throw examsRes.error;
      setTests((testsRes.data || []) as TestItem[]);
      setExams(examsRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load tests.'));
    } finally {
      setLoading(false);
    }
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
      exam_id: t.exam_id || '',
      is_global: t.is_global,
      duration_minutes: t.duration_minutes,
      total_marks: t.total_marks,
      shuffle_questions: t.shuffle_questions,
      allow_multiple_attempts: t.allow_multiple_attempts,
      instructions: t.instructions || '',
      status: t.status,
      scheduled_at: t.scheduled_at ? t.scheduled_at.slice(0, 16) : '',
      scheduled_end_at: t.scheduled_end_at ? t.scheduled_end_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.title.trim()) return 'Test title is required.';
    if (!form.is_global && !form.exam_id) return 'Choose an exam or mark the test global.';
    if (form.duration_minutes <= 0) return 'Duration must be greater than zero.';
    if (form.total_marks < 0) return 'Total marks cannot be negative.';
    const startsAt = form.scheduled_at ? new Date(form.scheduled_at).getTime() : null;
    const endsAt = form.scheduled_end_at ? new Date(form.scheduled_end_at).getTime() : null;
    if (startsAt != null && Number.isNaN(startsAt)) return 'Scheduled start is invalid.';
    if (endsAt != null && Number.isNaN(endsAt)) return 'Scheduled end is invalid.';
    if (startsAt != null && endsAt != null && endsAt <= startsAt) return 'Scheduled end must be after the start.';
    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const payload: Record<string, string | number | boolean | null> = {
      title: normalizeText(form.title),
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

    try {
      const { error: saveError } = editTest
        ? await supabase.from('tests').update(payload).eq('id', editTest.id)
        : await supabase.from('tests').insert(payload);
      if (saveError) throw saveError;
      setDialogOpen(false);
      toast.success(editTest ? 'Test updated.' : 'Test created.');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save test.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTest() {
    if (!deleteTestId) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.from('tests').delete().eq('id', deleteTestId);
      if (deleteError) throw deleteError;
      await loadData();
      setDeleteTestId('');
      toast.success('Test deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  }

  async function openQuestionManager(test: TestItem) {
    setQuestionTest(test);
    setQuestionDialogOpen(true);
    setAssignedQuestions([]);
    setAvailableQuestions([]);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setQuestionExamId(test.exam_id || '');
    setQuestionSubjectId('');
    setQuestionChapterId('');
    setQuestionTopicId('');
    await loadAssignedQuestions(test.id);
    if (test.exam_id) await loadQuestionSubjects(test.exam_id);
  }

  async function loadAssignedQuestions(testId: string) {
    const { data, error: assignedError } = await supabase
      .from('test_questions')
      .select('id, question_id, sort_order, question:questions(id, question_text, difficulty, marks, year)')
      .eq('test_id', testId)
      .order('sort_order');
    if (assignedError) {
      toast.error(getErrorMessage(assignedError, 'Unable to load assigned questions.'));
      return;
    }
    if (data) setAssignedQuestions(data as unknown as AssignedQuestionItem[]);
  }

  async function loadQuestionSubjects(examId: string) {
    const { data, error: subjectsError } = await supabase.from('subjects').select('*').eq('exam_id', examId).order('sort_order');
    if (subjectsError) {
      toast.error(getErrorMessage(subjectsError, 'Unable to load subjects.'));
      return;
    }
    setSubjects(data || []);
  }

  async function loadQuestionChapters(subjectId: string) {
    const { data, error: chaptersError } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).order('sort_order');
    if (chaptersError) {
      toast.error(getErrorMessage(chaptersError, 'Unable to load chapters.'));
      return;
    }
    setChapters(data || []);
  }

  async function loadQuestionTopics(chapterId: string) {
    const { data, error: topicsError } = await supabase.from('topics').select('*').eq('chapter_id', chapterId).order('sort_order');
    if (topicsError) {
      toast.error(getErrorMessage(topicsError, 'Unable to load topics.'));
      return;
    }
    setTopics(data || []);
  }

  async function loadAvailableQuestions(topicId: string) {
    setQuestionLoading(true);
    const { data, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, difficulty, marks, year')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (questionsError) {
      toast.error(getErrorMessage(questionsError, 'Unable to load available questions.'));
    } else {
      setAvailableQuestions((data || []) as QuestionPickerItem[]);
    }
    setQuestionLoading(false);
  }

  async function handleQuestionExamChange(examId: string) {
    setQuestionExamId(examId);
    setQuestionSubjectId('');
    setQuestionChapterId('');
    setQuestionTopicId('');
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setAvailableQuestions([]);
    if (examId) await loadQuestionSubjects(examId);
  }

  async function handleQuestionSubjectChange(subjectId: string) {
    setQuestionSubjectId(subjectId);
    setQuestionChapterId('');
    setQuestionTopicId('');
    setChapters([]);
    setTopics([]);
    setAvailableQuestions([]);
    if (subjectId) await loadQuestionChapters(subjectId);
  }

  async function handleQuestionChapterChange(chapterId: string) {
    setQuestionChapterId(chapterId);
    setQuestionTopicId('');
    setTopics([]);
    setAvailableQuestions([]);
    if (chapterId) await loadQuestionTopics(chapterId);
  }

  async function handleQuestionTopicChange(topicId: string) {
    setQuestionTopicId(topicId);
    setAvailableQuestions([]);
    if (topicId) await loadAvailableQuestions(topicId);
  }

  async function addQuestion(question: QuestionPickerItem) {
    if (!questionTest || assignedQuestions.some((q) => q.question_id === question.id)) return;
    setAssigningQuestionId(question.id);
    const { error } = await supabase.from('test_questions').insert({
      test_id: questionTest.id,
      question_id: question.id,
      sort_order: assignedQuestions.length + 1,
    });
    if (error) {
      toast.error(getErrorMessage(error, 'Could not assign question.'));
    } else {
      await loadAssignedQuestions(questionTest.id);
      toast.success('Question assigned.');
    }
    setAssigningQuestionId('');
  }

  async function removeQuestion(questionId: string) {
    if (!questionTest) return;
    const { error } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', questionTest.id)
      .eq('question_id', questionId);
    if (error) {
      toast.error(getErrorMessage(error, 'Could not remove question.'));
    } else {
      await loadAssignedQuestions(questionTest.id);
      toast.success('Question removed.');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={loadData} />;

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
            <Card key={t.id} className="group hover:-translate-y-[1px] hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--fg)] truncate">{t.title}</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">{t.exam?.name || 'No exam'}</p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(t)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-[var(--primary)] cursor-pointer" aria-label="Edit test">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleteTestId(t.id)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-red-400 cursor-pointer" aria-label="Delete test">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge dot variant={statusColors[t.status]}>{t.status}</Badge>
                {t.is_global && <Badge><Globe className="h-2.5 w-2.5 mr-0.5" /> Global</Badge>}
                      <span className="text-[10px] text-[var(--fg-muted)]">{t.duration_minutes}m - {t.total_marks} marks</span>
              </div>
              {t.scheduled_at && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--fg-muted)]">
                  <Calendar className="h-2.5 w-2.5" /> {formatDate(t.scheduled_at)}
                </div>
              )}
              <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border)]">
                <Button variant="secondary" size="sm" onClick={() => openQuestionManager(t)}>
                  <ListPlus className="h-3.5 w-3.5" /> Questions
                </Button>
              </div>
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
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TestStatus })} className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
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
            <Button size="sm" onClick={handleSave} disabled={!form.title.trim()} loading={saving}>
              {editTest ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Question Assignment Dialog */}
      <Dialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        title="Assign Questions"
        description={questionTest ? questionTest.title : undefined}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <select value={questionExamId} onChange={(e) => handleQuestionExamChange(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
              <option value="">Choose exam</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={questionSubjectId} onChange={(e) => handleQuestionSubjectChange(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!questionExamId}>
              <option value="">Choose subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={questionChapterId} onChange={(e) => handleQuestionChapterChange(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!questionSubjectId}>
              <option value="">Choose chapter</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={questionTopicId} onChange={(e) => handleQuestionTopicChange(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!questionChapterId}>
              <option value="">Choose topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-body)] border-b border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--fg)]">Assigned</p>
                <Badge variant="default">{assignedQuestions.length}</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {assignedQuestions.length === 0 ? (
                  <p className="text-xs text-[var(--fg-muted)] text-center py-8">No questions assigned yet.</p>
                ) : (
                  assignedQuestions.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-2 p-3">
                      <span className="h-6 w-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-semibold flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--fg)] line-clamp-2">{item.question?.question_text || 'Question deleted'}</p>
                        {item.question && (
                          <p className="text-[10px] text-[var(--fg-muted)] mt-1 capitalize">{item.question.difficulty} - {item.question.marks} marks</p>
                        )}
                      </div>
                      <button onClick={() => removeQuestion(item.question_id)} className="h-7 w-7 flex items-center justify-center rounded-full text-[var(--fg-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors" aria-label="Remove assigned question">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-body)] border-b border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--fg)]">Available Questions</p>
                <Badge variant="default">{availableQuestions.length}</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {questionLoading ? (
                  <p className="text-xs text-[var(--fg-muted)] text-center py-8">Loading questions...</p>
                ) : availableQuestions.length === 0 ? (
                  <p className="text-xs text-[var(--fg-muted)] text-center py-8">Choose a topic to add questions.</p>
                ) : (
                  availableQuestions.map((question) => {
                    const isAssigned = assignedQuestions.some((item) => item.question_id === question.id);
                    return (
                      <div key={question.id} className="flex items-start gap-2 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--fg)] line-clamp-2">{question.question_text}</p>
                          <p className="text-[10px] text-[var(--fg-muted)] mt-1 capitalize">{question.difficulty} - {question.marks} marks {question.year ? `- ${question.year}` : ''}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isAssigned ? 'secondary' : 'primary'}
                          disabled={isAssigned}
                          loading={assigningQuestionId === question.id}
                          onClick={() => addQuestion(question)}
                        >
                          {isAssigned ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {isAssigned ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTestId)}
        onOpenChange={(open) => !open && setDeleteTestId('')}
        title="Delete test"
        description="Delete this test? Existing attempts keep their history, but this test cannot be restored."
        confirmLabel="Delete"
        onConfirm={deleteTest}
        loading={deleting}
      />
    </div>
  );
}
