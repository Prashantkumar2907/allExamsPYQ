import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage, normalizeText } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Plus, Pencil, Trash2, FileText, CheckCircle } from 'lucide-react';
import type { Exam, Subject, Chapter, Topic, Question, QuestionType, Difficulty } from '../../types/database';

const QUESTIONS_PAGE_SIZE = 10;

interface QuestionWithOptions extends Omit<Question, 'options'> {
  options: { id: string; option_text: string; is_correct: boolean; explanation: string; sort_order: number }[];
}

interface OptionForm {
  option_text: string;
  is_correct: boolean;
  explanation: string;
}

export default function QuestionManagementPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);

  const [filterExam, setFilterExam] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQ, setEditQ] = useState<QuestionWithOptions | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState('');
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'single_choice' as QuestionType,
    difficulty: 'medium' as Difficulty,
    marks: 1,
    negative_marks: 0,
    explanation: '',
    year: '',
  });
  const [optionForms, setOptionForms] = useState<OptionForm[]>([
    { option_text: '', is_correct: true, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
  ]);

  useEffect(() => { setPage('Questions', 'Create and manage questions'); loadExams(); }, []);
  useEffect(() => {
    const reportedQuestionId = searchParams.get('question');
    if (reportedQuestionId) void openQuestionFromReport(reportedQuestionId);
  }, [searchParams]);
  useEffect(() => { if (filterExam) loadSubjects(); else { setSubjects([]); setFilterSubject(''); } }, [filterExam]);
  useEffect(() => { if (filterSubject) loadChapters(); else { setChapters([]); setFilterChapter(''); } }, [filterSubject]);
  useEffect(() => { if (filterChapter) loadTopics(); else { setTopics([]); setFilterTopic(''); } }, [filterChapter]);
  useEffect(() => { setQuestionPage(0); }, [filterExam, filterSubject, filterChapter, filterTopic]);
  useEffect(() => { loadQuestions(questionPage); }, [filterTopic, questionPage]);

  async function loadExams() {
    setLoading(true);
    setError('');
    try {
      const { data, error: examsError } = await supabase.from('exams').select('*').order('name');
      if (examsError) throw examsError;
      setExams(data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load exams.'));
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    const { data, error: subjectsError } = await supabase.from('subjects').select('*').eq('exam_id', filterExam).order('sort_order');
    if (subjectsError) {
      toast.error(getErrorMessage(subjectsError, 'Unable to load subjects.'));
      return;
    }
    setSubjects(data || []);
  }

  async function loadChapters() {
    const { data, error: chaptersError } = await supabase.from('chapters').select('*').eq('subject_id', filterSubject).order('sort_order');
    if (chaptersError) {
      toast.error(getErrorMessage(chaptersError, 'Unable to load chapters.'));
      return;
    }
    setChapters(data || []);
  }

  async function loadTopics() {
    const { data, error: topicsError } = await supabase.from('topics').select('*').eq('chapter_id', filterChapter).order('sort_order');
    if (topicsError) {
      toast.error(getErrorMessage(topicsError, 'Unable to load topics.'));
      return;
    }
    setTopics(data || []);
  }

  async function loadQuestions(page = 0) {
    const from = page * QUESTIONS_PAGE_SIZE;
    const to = from + QUESTIONS_PAGE_SIZE - 1;
    let query = supabase
      .from('questions')
      .select('*, options(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (filterTopic) query = query.eq('topic_id', filterTopic);
    const { data, count, error: questionsError } = await query;
    if (questionsError) {
      setError(getErrorMessage(questionsError, 'Unable to load questions.'));
      return;
    }
    setQuestions((data || []) as QuestionWithOptions[]);
    setQuestionTotal(count || 0);
  }

  function openCreate() {
    setEditQ(null);
    setForm({ question_text: '', question_type: 'single_choice', difficulty: 'medium', marks: 1, negative_marks: 0, explanation: '', year: '' });
    setOptionForms([
      { option_text: '', is_correct: true, explanation: '' },
      { option_text: '', is_correct: false, explanation: '' },
      { option_text: '', is_correct: false, explanation: '' },
      { option_text: '', is_correct: false, explanation: '' },
    ]);
    setDialogOpen(true);
  }

  function openEdit(q: QuestionWithOptions) {
    setEditQ(q);
    setForm({
      question_text: q.question_text,
      question_type: q.question_type as QuestionType,
      difficulty: q.difficulty as Difficulty,
      marks: q.marks,
      negative_marks: q.negative_marks,
      explanation: q.explanation || '',
      year: q.year != null ? String(q.year) : '',
    });
    const opts = [...q.options].sort((a, b) => a.sort_order - b.sort_order).map((o) => ({
      option_text: o.option_text,
      is_correct: o.is_correct,
      explanation: o.explanation || '',
    }));
    while (opts.length < 4) opts.push({ option_text: '', is_correct: false, explanation: '' });
    setOptionForms(opts);
    setDialogOpen(true);
  }

  async function openQuestionFromReport(questionId: string) {
    const { data, error: questionError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('id', questionId)
      .single();
    if (questionError) {
      toast.error(getErrorMessage(questionError, 'Unable to open the reported question.'));
      setSearchParams({}, { replace: true });
      return;
    }
    if (data) openEdit(data as QuestionWithOptions);
    setSearchParams({}, { replace: true });
  }

  function validateQuestionForm(topicId: string | undefined) {
    const validOptions = optionForms.filter((o) => o.option_text.trim());
    const correctOptions = validOptions.filter((o) => o.is_correct);
    const year = form.year ? Number(form.year) : null;

    if (!topicId) return 'Choose a topic before saving a question.';
    if (!form.question_text.trim()) return 'Question text is required.';
    if (validOptions.length < 2) return 'Add at least two answer options.';
    if (correctOptions.length !== 1) return 'Choose exactly one correct option.';
    if (form.marks < 0 || form.negative_marks < 0) return 'Marks cannot be negative.';
    if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
      return 'Year must be a whole number between 1900 and 2100.';
    }
    return null;
  }

  async function handleSave() {
    const topicId = filterTopic || editQ?.topic_id;
    const validationError = validateQuestionForm(topicId);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const questionPayload = {
        topic_id: topicId,
        question_text: normalizeText(form.question_text),
        question_type: form.question_type,
        difficulty: form.difficulty,
        marks: form.marks,
        negative_marks: form.negative_marks,
        year: form.year ? Number(form.year) : null,
        explanation: form.explanation || null,
      };

      if (editQ) {
        const { error: updateError } = await supabase.from('questions').update(questionPayload).eq('id', editQ.id);
        if (updateError) throw updateError;

        const opts = optionForms.filter((o) => o.option_text.trim()).map((o, i) => ({
          question_id: editQ.id,
          option_text: normalizeText(o.option_text),
          is_correct: o.is_correct,
          explanation: o.explanation || null,
          sort_order: i,
        }));
        const existingOptionIds = editQ.options.map((option) => option.id);
        if (opts.length) {
          const { error: optionsError } = await supabase.from('options').insert(opts).select('id');
          if (optionsError) throw optionsError;
        }
        if (existingOptionIds.length > 0) {
          const { error: deleteOptionsError } = await supabase.from('options').delete().in('id', existingOptionIds);
          if (deleteOptionsError) throw deleteOptionsError;
        }
      } else {
        const { data: newQ, error: createError } = await supabase.from('questions').insert(questionPayload).select().single();
        if (createError) throw createError;
        if (!newQ) throw new Error('Question was not created.');

        const opts = optionForms.filter((o) => o.option_text.trim()).map((o, i) => ({
          question_id: newQ.id,
          option_text: normalizeText(o.option_text),
          is_correct: o.is_correct,
          explanation: o.explanation || null,
          sort_order: i,
        }));
        if (opts.length) {
          const { error: optionsError } = await supabase.from('options').insert(opts);
          if (optionsError) throw optionsError;
        }
      }

      setDialogOpen(false);
      toast.success(editQ ? 'Question updated.' : 'Question created.');
      loadQuestions(questionPage);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save question.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!deleteQuestionId) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('questions').delete().eq('id', deleteQuestionId);
      if (deleteError) throw deleteError;
      const nextTotal = Math.max(0, questionTotal - 1);
      const maxPage = Math.max(0, Math.ceil(nextTotal / QUESTIONS_PAGE_SIZE) - 1);
      const nextPage = Math.min(questionPage, maxPage);
      setQuestionPage(nextPage);
      await loadQuestions(nextPage);
      setDeleteQuestionId('');
      toast.success('Question deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        <div className="h-12 rounded-lg animate-shimmer" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={loadExams} />;
  const canCreateQuestion = Boolean(filterTopic);
  const createHelpText = !filterExam
    ? 'Select an exam, subject, chapter, and topic before adding a question.'
    : !filterSubject
    ? 'Select a subject, chapter, and topic before adding a question.'
    : !filterChapter
    ? 'Select a chapter and topic before adding a question.'
    : !filterTopic
    ? 'Select a topic before adding a question.'
    : '';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)] sm:text-2xl">Questions</h1>
          <p className="text-xs text-[var(--fg-muted)] sm:hidden">{questionTotal} questions in the current view</p>
        </div>
        <div className="w-full sm:w-auto sm:text-right">
          <Button
            size="sm"
            onClick={openCreate}
            disabled={!canCreateQuestion}
            className="w-full sm:w-auto"
            aria-describedby={!canCreateQuestion ? 'add-question-help' : undefined}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
          </Button>
          {!canCreateQuestion && (
            <p id="add-question-help" className="mt-1 text-[11px] text-[var(--fg-muted)]">
              {createHelpText}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2.5">Filter Questions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select aria-label="Filter by exam" value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
            <option value="">All Exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select aria-label="Filter by subject" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterExam}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select aria-label="Filter by chapter" value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterSubject}>
            <option value="">All Chapters</option>
            {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Filter by topic" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterChapter}>
            <option value="">All Topics</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">Question Bank</p>
            <p className="text-[11px] text-[var(--fg-muted)]">{questionTotal} total records</p>
          </div>
          <Badge variant="default">Page {questionPage + 1}</Badge>
        </div>

        {questions.length === 0 ? (
          <div className="pt-4">
            <EmptyState icon={FileText} title="No questions" description={filterTopic ? 'No questions in this topic yet.' : 'Select a topic to filter questions.'} />
          </div>
        ) : (
          <>
            <div className="space-y-2 pt-3">
              {questions.map((q) => (
                <div key={q.id} className="group flex flex-col gap-3 rounded-xl border border-transparent bg-[var(--bg-body)] p-3 transition hover:border-[var(--border)] hover:bg-[var(--bg-surface-hover)] sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-[var(--fg)]">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge dot variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-[10px] text-[var(--fg-muted)]">{q.marks} marks</span>
                      {q.year && <span className="text-[10px] text-[var(--fg-muted)]">{q.year}</span>}
                      <span className="text-[10px] text-[var(--fg-muted)]">{q.options?.length || 0} options</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 sm:flex-shrink-0 sm:opacity-80 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button onClick={() => openEdit(q)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] transition-colors hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] cursor-pointer focus-ring" aria-label="Edit question">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteQuestionId(q.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer focus-ring" aria-label="Delete question">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              className="mt-3"
              page={questionPage}
              pageSize={QUESTIONS_PAGE_SIZE}
              total={questionTotal}
              onPageChange={setQuestionPage}
            />
          </>
        )}
      </Card>

      {/* Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editQ ? 'Edit Question' : 'Add Question'}>
        <div className="space-y-4 max-h-[70dvh] overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Question Details</p>
          <div>
            <label htmlFor="q-text" className="block text-xs font-medium text-[var(--fg)] mb-1">Question Text</label>
            <textarea
              id="q-text"
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="q-difficulty" className="block text-xs font-medium text-[var(--fg)] mb-1">Difficulty</label>
              <select id="q-difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <Input id="q-year" label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g., 2024" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input id="q-marks" label="Marks" type="number" value={String(form.marks)} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
            <Input id="q-neg" label="Negative Marks" type="number" value={String(form.negative_marks)} onChange={(e) => setForm({ ...form, negative_marks: Number(e.target.value) })} />
          </div>

          <div>
            <label htmlFor="q-explanation" className="block text-xs font-medium text-[var(--fg)] mb-1">Explanation</label>
            <textarea
              id="q-explanation"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
              placeholder="Optional explanation..."
            />
          </div>

          {/* Options */}
          <div>
            <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">Answer Options</p>
            <div className="space-y-2">
              {optionForms.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOptionForms((prev) => prev.map((o, j) => ({ ...o, is_correct: j === i })));
                    }}
                    className={cn(
                      'mt-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      opt.is_correct ? 'border-green-500 bg-green-500' : 'border-[var(--border)]'
                    )}
                    aria-label={`Set ${String.fromCharCode(65 + i)} as correct`}
                  >
                    {opt.is_correct && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <input
                      aria-label={`Answer option ${String.fromCharCode(65 + i)}`}
                      value={opt.option_text}
                      onChange={(e) => {
                        const updated = [...optionForms];
                        updated[i] = { ...updated[i], option_text: e.target.value };
                        setOptionForms(updated);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                    <input
                      aria-label={`Explanation for ${String.fromCharCode(65 + i)}`}
                      value={opt.explanation}
                      onChange={(e) => {
                        const updated = [...optionForms];
                        updated[i] = { ...updated[i], explanation: e.target.value };
                        setOptionForms(updated);
                      }}
                      placeholder="Explanation (optional)"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.question_text.trim()} loading={saving}>
              {editQ ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteQuestionId)}
        onOpenChange={(open) => !open && setDeleteQuestionId('')}
        title="Delete question"
        description="Delete this question and its options? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={deleteQuestion}
        loading={saving}
      />
    </div>
  );
}
