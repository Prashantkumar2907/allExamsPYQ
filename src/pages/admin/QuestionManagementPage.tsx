import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { cn } from '../../lib/utils';
import { Plus, Pencil, Trash2, FileText, CheckCircle } from 'lucide-react';
import type { Exam, Subject, Chapter, Topic, Question, QuestionType, Difficulty } from '../../types/database';

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
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);

  const [filterExam, setFilterExam] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterTopic, setFilterTopic] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQ, setEditQ] = useState<QuestionWithOptions | null>(null);
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
  useEffect(() => { if (filterExam) loadSubjects(); else { setSubjects([]); setFilterSubject(''); } }, [filterExam]);
  useEffect(() => { if (filterSubject) loadChapters(); else { setChapters([]); setFilterChapter(''); } }, [filterSubject]);
  useEffect(() => { if (filterChapter) loadTopics(); else { setTopics([]); setFilterTopic(''); } }, [filterChapter]);
  useEffect(() => { loadQuestions(); }, [filterTopic]);

  async function loadExams() {
    const { data } = await supabase.from('exams').select('*').order('name');
    if (data) setExams(data);
    setLoading(false);
  }

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').eq('exam_id', filterExam).order('sort_order');
    if (data) setSubjects(data);
  }

  async function loadChapters() {
    const { data } = await supabase.from('chapters').select('*').eq('subject_id', filterSubject).order('sort_order');
    if (data) setChapters(data);
  }

  async function loadTopics() {
    const { data } = await supabase.from('topics').select('*').eq('chapter_id', filterChapter).order('sort_order');
    if (data) setTopics(data);
  }

  async function loadQuestions() {
    let query = supabase.from('questions').select('*, options(*)').order('created_at', { ascending: false }).limit(50);
    if (filterTopic) query = query.eq('topic_id', filterTopic);
    const { data } = await query;
    if (data) setQuestions(data as QuestionWithOptions[]);
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
    const opts = q.options.sort((a, b) => a.sort_order - b.sort_order).map((o) => ({
      option_text: o.option_text,
      is_correct: o.is_correct,
      explanation: o.explanation || '',
    }));
    while (opts.length < 4) opts.push({ option_text: '', is_correct: false, explanation: '' });
    setOptionForms(opts);
    setDialogOpen(true);
  }

  async function handleSave() {
    const topicId = filterTopic || editQ?.topic_id;
    if (!topicId) return;

    if (editQ) {
      await supabase.from('questions').update({
        topic_id: topicId,
        question_text: form.question_text,
        question_type: form.question_type,
        difficulty: form.difficulty,
        marks: form.marks,
        negative_marks: form.negative_marks,
        year: form.year ? Number(form.year) : null,
        explanation: form.explanation || null,
      }).eq('id', editQ.id);
      await supabase.from('options').delete().eq('question_id', editQ.id);
      const opts = optionForms.filter((o) => o.option_text.trim()).map((o, i) => ({
        question_id: editQ.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
        explanation: o.explanation || null,
        sort_order: i,
      }));
      if (opts.length) await supabase.from('options').insert(opts);
    } else {
      const { data: newQ } = await supabase.from('questions').insert({
        topic_id: topicId,
        question_text: form.question_text,
        question_type: form.question_type,
        difficulty: form.difficulty,
        marks: form.marks,
        negative_marks: form.negative_marks,
        year: form.year ? Number(form.year) : null,
        explanation: form.explanation || null,
      }).select().single();
      if (newQ) {
        const opts = optionForms.filter((o) => o.option_text.trim()).map((o, i) => ({
          question_id: newQ.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
          explanation: o.explanation || null,
          sort_order: i,
        }));
        if (opts.length) await supabase.from('options').insert(opts);
      }
    }
    setDialogOpen(false);
    loadQuestions();
  }

  async function deleteQuestion(id: string) {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    loadQuestions();
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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--fg)]">Questions</h1>
        <Button size="sm" onClick={openCreate} disabled={!filterTopic}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2.5">Filter Questions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
            <option value="">All Exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterExam}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterSubject}>
            <option value="">All Chapters</option>
            {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none" disabled={!filterChapter}>
            <option value="">All Topics</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        {questions.length === 0 ? (
          <EmptyState icon={FileText} title="No questions" description={filterTopic ? 'No questions in this topic yet.' : 'Select a topic to filter questions.'} />
        ) : (
          <div className="space-y-2 max-h-[calc(100dvh-18rem)] overflow-y-auto">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--bg-body)] border border-transparent hover:border-[var(--border)] hover:shadow-sm transition-all group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--fg)] line-clamp-2 mb-1">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge dot variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}>
                      {q.difficulty}
                    </Badge>
                    <span className="text-[10px] text-[var(--fg-muted)]">{q.marks} marks</span>
                    {q.year && <span className="text-[10px] text-[var(--fg-muted)]">{q.year}</span>}
                    <span className="text-[10px] text-[var(--fg-muted)]">{q.options?.length || 0} options</span>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(q)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-[var(--primary)]">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteQuestion(q.id)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editQ ? 'Edit Question' : 'Add Question'}>
        <div className="space-y-4 max-h-[70dvh] overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Question Details</p>
          <div>
            <label className="block text-xs font-medium text-[var(--fg)] mb-1">Question Text</label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--fg)] mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })} className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none">
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
            <label className="block text-xs font-medium text-[var(--fg)] mb-1">Explanation</label>
            <textarea
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
                  >
                    {opt.is_correct && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <input
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
            <Button size="sm" onClick={handleSave} disabled={!form.question_text.trim()}>
              {editQ ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
