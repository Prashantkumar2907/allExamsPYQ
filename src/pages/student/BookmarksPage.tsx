import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';
import { getErrorMessage } from '../../lib/api';
import { Bookmark, Trash2, CheckCircle, Search, ChevronRight, BookOpen, Filter, XCircle } from 'lucide-react';
import type { Question, Option } from '../../types/database';

interface BookmarkItem {
  id: string;
  notes: string | null;
  question: Question & {
    options: Option[];
    topic?: { id: string; name: string; chapter?: { id: string; name: string; subject?: { id: string; name: string } } };
  };
}

export default function BookmarksPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBm, setSelectedBm] = useState<BookmarkItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string>('all');

  const PAGE_SIZE = 30;

  useEffect(() => {
    setPage('Bookmarks', 'Review your saved questions');
    if (profile) void loadBookmarks();
  }, [profile]);

  async function loadBookmarks(append = false) {
    if (!profile) return;
    const from = append ? bookmarks.length : 0;
    if (!append) setError('');
    const { data, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*, question:questions(*, options(*), topic:topics(id, name, chapter:chapters(id, name, subject:subjects(id, name))))')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (bookmarksError) {
      setError(getErrorMessage(bookmarksError, 'Unable to load bookmarks.'));
      setLoading(false);
      return;
    }
    if (data) {
      setBookmarks(prev => append ? [...prev, ...(data as BookmarkItem[])] : data as BookmarkItem[]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }

  async function removeBookmark(id: string) {
    const { error: removeError } = await supabase.from('bookmarks').delete().eq('id', id);
    if (removeError) {
      toast.error(getErrorMessage(removeError, 'Could not remove bookmark.'));
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBm?.id === id) setSelectedBm(null);
    toast.success('Bookmark removed.');
  }

  function openSheet(bm: BookmarkItem) { setSelectedBm(bm); setNoteText(bm.notes ?? ''); }

  async function saveNote() {
    if (!selectedBm) return;
    setSavingNote(true);
    const { error: noteError } = await supabase.from('bookmarks').update({ notes: noteText }).eq('id', selectedBm.id);
    if (noteError) {
      toast.error(getErrorMessage(noteError, 'Could not save notes.'));
      setSavingNote(false);
      return;
    }
    setBookmarks((prev) => prev.map((b) => b.id === selectedBm.id ? { ...b, notes: noteText } : b));
    setSavingNote(false);
    toast.success('Notes saved.');
  }

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    bookmarks.forEach((bm) => {
      const subj = bm.question.topic?.chapter?.subject;
      if (subj) map.set(subj.id, subj.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (activeSubject !== 'all') {
      filtered = filtered.filter((bm) => bm.question.topic?.chapter?.subject?.id === activeSubject);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((bm) => bm.question.question_text.toLowerCase().includes(q));
    }
    return filtered;
  }, [bookmarks, activeSubject, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="h-10 rounded-lg animate-shimmer" />
        <div className="h-8 rounded-lg animate-shimmer w-2/3" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={() => loadBookmarks()} />;

  if (!bookmarks.length) {
    return <EmptyState icon={Bookmark} title="No bookmarks yet" description="Bookmark questions from test results to review them later." />;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
        <input
          type="text"
          placeholder="Search bookmarked questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition"
        />
      </div>

      {/* Subject filter tabs */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)] flex-shrink-0" />
          <button
            onClick={() => setActiveSubject('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition',
              activeSubject === 'all'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)]'
            )}
          >
            All ({bookmarks.length})
          </button>
          {subjects.map((subj) => {
            const count = bookmarks.filter((bm) => bm.question.topic?.chapter?.subject?.id === subj.id).length;
            return (
              <button
                key={subj.id}
                onClick={() => setActiveSubject(subj.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition',
                  activeSubject === subj.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                {subj.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bookmark list */}
      <Card className="!p-0 divide-y divide-[var(--border)]">
        {filteredBookmarks.map((bm) => {
          const q = bm.question;
          const subjectName = q.topic?.chapter?.subject?.name;
          const correctOpt = q.options?.find((o) => o.is_correct);
          return (
            <div
              key={bm.id}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors group focus-ring"
              onClick={() => openSheet(bm)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openSheet(bm);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--fg)] line-clamp-1">{q.question_text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'} className="text-[10px]">
                    {q.difficulty}
                  </Badge>
                  {subjectName && (
                    <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-0.5">
                      <BookOpen className="h-2.5 w-2.5" /> {subjectName}
                    </span>
                  )}
                  {correctOpt && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-600 truncate max-w-48">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" /> {correctOpt.option_text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id); }}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-80 sm:group-hover:opacity-100 focus-ring"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              </div>
            </div>
          );
        })}
      </Card>

      {hasMore && !searchQuery && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => loadBookmarks(true)}>
            Load More
          </Button>
        </div>
      )}

      {searchQuery && filteredBookmarks.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-8 w-8 text-[var(--fg-muted)]/30 mx-auto mb-2" />
          <p className="text-sm text-[var(--fg-muted)]">No bookmarks matching "{searchQuery}"</p>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedBm} onOpenChange={(open) => { if (!open) setSelectedBm(null); }} title="Bookmarked Question">
        {selectedBm && (() => {
          const q = selectedBm.question;
          const subjectName = q.topic?.chapter?.subject?.name;
          const chapterName = q.topic?.chapter?.name;
          const topicName = q.topic?.name;
          return (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'} className="text-[10px]">{q.difficulty}</Badge>
                {q.year && <Badge variant="default" className="text-[10px]">{q.year}</Badge>}
                <span className="text-[10px] text-[var(--fg-muted)]">+{q.marks} / -{q.negative_marks} marks</span>
              </div>

              {/* Breadcrumb */}
              {subjectName && (
                <p className="text-[10px] text-[var(--fg-muted)]">
                  {[subjectName, chapterName, topicName].filter(Boolean).join(' / ')}
                </p>
              )}

              {/* Question */}
              <p className="text-sm text-[var(--fg)] leading-relaxed font-medium">{q.question_text}</p>

              {/* Options with explanations */}
              <div className="space-y-2">
                {[...(q.options ?? [])]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((opt, i) => {
                    const optLetter = String.fromCharCode(65 + i);
                    return (
                      <div key={opt.id} className={cn('rounded-lg px-3 py-2.5 border transition-colors', opt.is_correct ? 'bg-green-500/8 border-green-500/25' : 'bg-[var(--bg-body)] border-transparent')}>
                        <div className="flex items-start gap-2.5">
                          <span className={cn('mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold', opt.is_correct ? 'bg-green-500 text-white' : 'bg-[var(--border)] text-[var(--fg-muted)]')}>
                            {opt.is_correct ? <CheckCircle className="h-3.5 w-3.5" /> : optLetter}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm text-[var(--fg)]', opt.is_correct && 'font-medium')}>{opt.option_text}</p>
                            {opt.explanation && <p className="text-xs text-[var(--fg-muted)] mt-1.5 leading-relaxed italic">{opt.explanation}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Question explanation */}
              {q.explanation && (
                <div className="rounded-lg bg-[var(--primary)]/8 border border-[var(--primary)]/15 p-3">
                  <p className="text-xs font-semibold text-[var(--primary)] mb-1">Explanation</p>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{q.explanation}</p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-medium text-[var(--fg-muted)] block">Your Notes</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Add your notes about this question..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-body)] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveNote} disabled={savingNote} loading={savingNote}>
                    {savingNote ? 'Saving...' : 'Save Notes'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => removeBookmark(selectedBm.id)}>
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
