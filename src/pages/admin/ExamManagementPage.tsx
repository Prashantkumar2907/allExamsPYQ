import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage, normalizeText } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  BookOpen, Folder, FileText, Tag,
} from 'lucide-react';
import type { Exam, Subject, Chapter, Topic } from '../../types/database';

type Level = 'exams' | 'subjects' | 'chapters' | 'topics';
type HierarchyItem = Exam | Subject | Chapter | Topic;

export default function ExamManagementPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLevel, setDialogLevel] = useState<Level>('exams');
  const [editItem, setEditItem] = useState<HierarchyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ level: Level; item: HierarchyItem } | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);

  useEffect(() => { setPage('Exams', 'Manage exams and syllabus'); loadExams(); }, []);

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

  async function loadSubjects(examId: string) {
    const { data, error: subjectsError } = await supabase.from('subjects').select('*').eq('exam_id', examId).order('sort_order');
    if (subjectsError) {
      toast.error(getErrorMessage(subjectsError, 'Unable to load subjects.'));
      return;
    }
    if (data) setSubjects(data);
  }

  async function loadChapters(subjectId: string) {
    const { data, error: chaptersError } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).order('sort_order');
    if (chaptersError) {
      toast.error(getErrorMessage(chaptersError, 'Unable to load chapters.'));
      return;
    }
    if (data) setChapters(data);
  }

  async function loadTopics(chapterId: string) {
    const { data, error: topicsError } = await supabase.from('topics').select('*').eq('chapter_id', chapterId).order('sort_order');
    if (topicsError) {
      toast.error(getErrorMessage(topicsError, 'Unable to load topics.'));
      return;
    }
    if (data) setTopics(data);
  }

  function selectExam(exam: Exam) {
    setSelectedExam(exam);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    loadSubjects(exam.id);
  }

  function selectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setChapters([]);
    setTopics([]);
    loadChapters(subject.id);
  }

  function selectChapter(chapter: Chapter) {
    setSelectedChapter(chapter);
    setTopics([]);
    loadTopics(chapter.id);
  }

  function openCreate(level: Level) {
    setDialogLevel(level);
    setEditItem(null);
    setFormName('');
    setFormDescription('');
    setFormSortOrder(0);
    setDialogOpen(true);
  }

  function openEdit(level: Level, item: HierarchyItem) {
    setDialogLevel(level);
    setEditItem(item);
    setFormName(item.name);
    setFormDescription('description' in item ? item.description || '' : '');
    setFormSortOrder('sort_order' in item ? item.sort_order || 0 : 0);
    setDialogOpen(true);
  }

  async function handleSave() {
    const table = dialogLevel;
    const name = normalizeText(formName);
    if (!name) return;

    setSaving(true);
    try {
      if (editItem) {
        const updates: Record<string, string | number | null> = { name };
        if (table === 'exams') updates.description = formDescription || null;
        if (table === 'subjects') { updates.description = formDescription || null; updates.sort_order = formSortOrder; }
        if (table === 'chapters' || table === 'topics') updates.sort_order = formSortOrder;
        const { error: updateError } = await supabase.from(table).update(updates).eq('id', editItem.id);
        if (updateError) throw updateError;
      } else {
        const insert: Record<string, string | number | null> = { name };
        if (table === 'exams') insert.description = formDescription || null;
        if (table === 'subjects') { insert.exam_id = selectedExam!.id; insert.description = formDescription || null; insert.sort_order = formSortOrder; }
        if (table === 'chapters') { insert.subject_id = selectedSubject!.id; insert.sort_order = formSortOrder; }
        if (table === 'topics') { insert.chapter_id = selectedChapter!.id; insert.sort_order = formSortOrder; }
        const { error: insertError } = await supabase.from(table).insert(insert);
        if (insertError) throw insertError;
      }

      setDialogOpen(false);
      toast.success(editItem ? 'Item updated.' : 'Item created.');
      if (table === 'exams') await loadExams();
      if (table === 'subjects' && selectedExam) await loadSubjects(selectedExam.id);
      if (table === 'chapters' && selectedSubject) await loadChapters(selectedSubject.id);
      if (table === 'topics' && selectedChapter) await loadTopics(selectedChapter.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this item.'));
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(level: Level, item: HierarchyItem) {
    setDeleteTarget({ level, item });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { level, item } = deleteTarget;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.from(level).delete().eq('id', item.id);
      if (deleteError) throw deleteError;
      if (level === 'exams') { await loadExams(); setSelectedExam(null); }
      if (level === 'subjects' && selectedExam) { await loadSubjects(selectedExam.id); setSelectedSubject(null); }
      if (level === 'chapters' && selectedSubject) { await loadChapters(selectedSubject.id); setSelectedChapter(null); }
      if (level === 'topics' && selectedChapter) await loadTopics(selectedChapter.id);
      toast.success('Item deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState description={error} onRetry={loadExams} />;

  const levelIcons = { exams: BookOpen, subjects: Folder, chapters: FileText, topics: Tag };

  function renderList<T extends HierarchyItem>(items: T[], level: Level, onSelect?: (item: T) => void, selectedId?: string) {
    const Icon = levelIcons[level];
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider flex items-center gap-1">
            <Icon className="h-3 w-3" /> {level}
          </h3>
          <Button size="sm" onClick={() => openCreate(level)}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {items.length === 0 && (
          <p className="text-[10px] text-[var(--fg-muted)] text-center py-2">No {level} yet</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition duration-150 group',
              selectedId === item.id
                ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                : 'hover:bg-[var(--bg-surface-hover)] hover:-translate-y-[1px] hover:shadow-sm text-[var(--fg)]'
            )}
            onClick={() => onSelect?.(item)}
          >
            {onSelect && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
            <span className="flex-1 text-xs truncate">{item.name}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(level, item); }}
                className="h-5 w-5 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-[var(--primary)] cursor-pointer"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); requestDelete(level, item); }}
                className="h-5 w-5 flex items-center justify-center rounded text-[var(--fg-muted)] hover:text-red-400 cursor-pointer"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--fg)]">Exam Management</h1>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 flex-wrap">
        <button onClick={() => { setSelectedExam(null); setSelectedSubject(null); setSelectedChapter(null); }} className="font-medium hover:text-[var(--primary)] transition-colors text-[var(--fg-muted)] cursor-pointer">
          All Exams
        </button>
        {selectedExam && (
          <>
            <ChevronRight className="h-3 w-3 text-[var(--fg-muted)]" />
            <button onClick={() => { setSelectedSubject(null); setSelectedChapter(null); }} className="font-medium hover:text-[var(--primary)] transition-colors text-[var(--fg)] cursor-pointer">
              {selectedExam.name}
            </button>
          </>
        )}
        {selectedSubject && (
          <>
            <ChevronRight className="h-3 w-3 text-[var(--fg-muted)]" />
            <button onClick={() => setSelectedChapter(null)} className="font-medium hover:text-[var(--primary)] transition-colors text-[var(--fg)]">
              {selectedSubject.name}
            </button>
          </>
        )}
        {selectedChapter && (
          <>
            <ChevronRight className="h-3 w-3 text-[var(--fg-muted)]" />
            <span className="font-medium text-[var(--primary)]">{selectedChapter.name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-2 border-l-[var(--primary)]">{renderList(exams, 'exams', selectExam, selectedExam?.id)}</Card>
        {selectedExam && <Card className="border-l-2 border-l-amber-500">{renderList(subjects, 'subjects', selectSubject, selectedSubject?.id)}</Card>}
        {selectedSubject && <Card className="border-l-2 border-l-green-500">{renderList(chapters, 'chapters', selectChapter, selectedChapter?.id)}</Card>}
        {selectedChapter && <Card className="border-l-2 border-l-purple-500">{renderList(topics, 'topics')}</Card>}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={`${editItem ? 'Edit' : 'Add'} ${dialogLevel.slice(0, -1)}`}>
        <div className="space-y-3">
          <Input id="item-name" label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          {(dialogLevel === 'exams' || dialogLevel === 'subjects') && (
            <Input id="item-desc" label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          )}
          {dialogLevel !== 'exams' && (
            <Input
              id="item-sort"
              label="Sort Order"
              type="number"
              value={String(formSortOrder)}
              onChange={(e) => setFormSortOrder(Number(e.target.value))}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim()} loading={saving}>
              {editItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete syllabus item"
        description={`Delete "${deleteTarget?.item.name ?? 'this item'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
