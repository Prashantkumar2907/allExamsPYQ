import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../lib/api';
import { BookOpen, ChevronRight, ArrowLeft, Play, Layers, FileText, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Subject, Chapter, Topic } from '../../types/database';

type Level = 'subjects' | 'chapters' | 'topics';

export default function ExamBrowserPage() {
  const { profile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingKey, setStartingKey] = useState('');
  const [level, setLevel] = useState<Level>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setPage('Exam Browser', 'Explore subjects and topics');
    if (!profile?.exam_id) {
      setLoading(false);
      return;
    }
    loadSubjects();
  }, [profile]);

  async function loadSubjects() {
    setLoading(true);
    setError('');
    try {
      const { data, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('exam_id', profile!.exam_id!)
        .order('sort_order');
      if (subjectsError) throw subjectsError;
      setSubjects(data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load subjects.'));
    } finally {
      setLoading(false);
    }
  }

  async function selectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setLevel('chapters');
    setLoading(true);
    setError('');
    try {
      const { data, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subject.id)
        .order('sort_order');
      if (chaptersError) throw chaptersError;
      setChapters(data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load chapters.'));
    } finally {
      setLoading(false);
    }
  }

  async function selectChapter(chapter: Chapter) {
    setSelectedChapter(chapter);
    setLevel('topics');
    setLoading(true);
    setError('');
    try {
      const { data, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('chapter_id', chapter.id)
        .order('sort_order');
      if (topicsError) throw topicsError;
      setTopics(data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load topics.'));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (level === 'topics') {
      setLevel('chapters');
      setSelectedChapter(null);
    } else if (level === 'chapters') {
      setLevel('subjects');
      setSelectedSubject(null);
    }
  }

  async function startPractice(sourceType: 'topic' | 'chapter' | 'subject', sourceId: string) {
    if (!profile) return;
    const key = `${sourceType}:${sourceId}`;
    setStartingKey(key);
    try {
      const { data: attemptId, error: startError } = await supabase.rpc('start_practice_attempt', {
        p_source_type: sourceType,
        p_source_id: sourceId,
      });
      if (startError) throw startError;
      if (!attemptId) throw new Error('Could not create a practice attempt.');
      navigate(`/test/${attemptId as string}`);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not start practice.');
      if (message.includes('No active questions')) toast.info(message);
      else toast.error(message);
    } finally {
      setStartingKey('');
    }
  }

  if (!profile?.exam_id) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Exam Selected"
        description="Select an exam in your profile to browse subjects"
        action={<Button onClick={() => navigate('/profile')}>Go to Profile</Button>}
      />
    );
  }

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="h-8 w-1/2 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
      </div>
    </div>
  );
  if (error) return <ErrorState description={error} onRetry={loadSubjects} />;

  const breadcrumb = [
    profile.exam?.name || 'Exam',
    ...(selectedSubject ? [selectedSubject.name] : []),
    ...(selectedChapter ? [selectedChapter.name] : []),
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        {level !== 'subjects' && (
          <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--fg)]">Exam Browser</h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mt-1">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-[var(--fg-muted)]" />}
                <span className={cn(
                  'text-xs font-medium',
                  i === breadcrumb.length - 1 ? 'text-[var(--primary)]' : 'text-[var(--fg-muted)]'
                )}>{b}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {level === 'subjects' &&
          subjects.map((s) => (
            <Card
              key={s.id}
              className="hover:translate-y-[-2px] hover:shadow-lg transition duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors">
                  <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-[11px] text-[var(--fg-muted)] truncate mt-0.5">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => selectSubject(s)}
                    aria-label={`Open ${s.name}`}
                    title={`Open ${s.name}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startPractice('subject', s.id)}
                    loading={startingKey === `subject:${s.id}`}
                  >
                    <Play className="h-3 w-3" /> Practice
                  </Button>
                </div>
              </div>
            </Card>
          ))}

        {level === 'chapters' &&
          chapters.map((c) => (
            <Card
              key={c.id}
              className="hover:translate-y-[-2px] hover:shadow-lg transition duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/15 transition-colors">
                  <Layers className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{c.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => selectChapter(c)}
                    aria-label={`Open ${c.name}`}
                    title={`Open ${c.name}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startPractice('chapter', c.id)}
                    loading={startingKey === `chapter:${c.id}`}
                  >
                    <Play className="h-3 w-3" /> Practice
                  </Button>
                </div>
              </div>
            </Card>
          ))}

        {level === 'topics' &&
          topics.map((t) => (
            <Card
              key={t.id}
              className="hover:translate-y-[-2px] hover:shadow-lg transition duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/15 transition-colors">
                  <Hash className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-[var(--fg)] truncate flex-1">{t.name}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startPractice('topic', t.id)}
                  className="flex-shrink-0"
                  loading={startingKey === `topic:${t.id}`}
                >
                  <Play className="h-3 w-3" /> Practice
                </Button>
              </div>
            </Card>
          ))}
      </div>

      {((level === 'subjects' && subjects.length === 0) ||
        (level === 'chapters' && chapters.length === 0) ||
        (level === 'topics' && topics.length === 0)) && (
        <EmptyState title="Nothing here yet" description="Content will appear once added by admin" />
      )}
    </div>
  );
}
