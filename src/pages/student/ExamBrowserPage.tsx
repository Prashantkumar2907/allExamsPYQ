import { useEffect, useState, type KeyboardEvent } from 'react';
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

  async function startPractice(sourceType: 'topic' | 'chapter' | 'subject', sourceId: string, sourceName: string) {
    if (!profile) return;
    const key = `${sourceType}:${sourceId}`;
    setStartingKey(key);
    let questionIds: string[] = [];

    try {
      if (sourceType === 'topic') {
        const { data, error: questionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('topic_id', sourceId)
          .eq('is_active', true)
          .limit(20);
        if (questionsError) throw questionsError;
        questionIds = data?.map((q) => q.id) ?? [];
      } else if (sourceType === 'chapter') {
        const { data: topicData, error: topicsError } = await supabase.from('topics').select('id').eq('chapter_id', sourceId);
        if (topicsError) throw topicsError;
        const topicIds = topicData?.map((t) => t.id) ?? [];
        if (topicIds.length > 0) {
          const { data, error: questionsError } = await supabase
            .from('questions')
            .select('id')
            .in('topic_id', topicIds)
            .eq('is_active', true)
            .limit(20);
          if (questionsError) throw questionsError;
          questionIds = data?.map((q) => q.id) ?? [];
        }
      } else if (sourceType === 'subject') {
        const { data: chapterData, error: chaptersError } = await supabase.from('chapters').select('id').eq('subject_id', sourceId);
        if (chaptersError) throw chaptersError;
        const chapterIds = chapterData?.map((chapter) => chapter.id) ?? [];
        if (chapterIds.length > 0) {
          const { data: topicData, error: topicsError } = await supabase.from('topics').select('id').in('chapter_id', chapterIds);
          if (topicsError) throw topicsError;
          const topicIds = topicData?.map((topic) => topic.id) ?? [];
          if (topicIds.length > 0) {
            const { data, error: questionsError } = await supabase
              .from('questions')
              .select('id')
              .in('topic_id', topicIds)
              .eq('is_active', true)
              .limit(20);
            if (questionsError) throw questionsError;
            questionIds = data?.map((q) => q.id) ?? [];
          }
        }
      }

      if (questionIds.length === 0) {
        toast.info('No active questions found for this selection yet.');
        return;
      }

      const totalMarks = questionIds.length * 4;
      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          user_id: profile.id,
          source_type: sourceType,
          source_id: sourceId,
          source_name: sourceName,
          total_questions: questionIds.length,
          total_marks: totalMarks,
          duration_minutes: Math.max(questionIds.length * 2, 10),
          status: 'in_progress' as const,
        })
        .select()
        .single();
      if (attemptError) throw attemptError;
      if (!attempt) throw new Error('Could not create a practice attempt.');

      const { error: answersError } = await supabase.from('user_answers').insert(
        questionIds.map((qid) => ({
          attempt_id: attempt.id,
          question_id: qid,
          time_spent_seconds: 0,
        }))
      );
      if (answersError) throw answersError;
      navigate(`/test/${attempt.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start practice.'));
    } finally {
      setStartingKey('');
    }
  }

  function handleCardKey(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
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
              className="cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200 group"
              onClick={() => selectSubject(s)}
              onKeyDown={(event) => handleCardKey(event, () => selectSubject(s))}
              role="button"
              tabIndex={0}
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
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startPractice('subject', s.id, s.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    loading={startingKey === `subject:${s.id}`}
                  >
                    <Play className="h-3 w-3" /> Practice
                  </Button>
                  <ChevronRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Card>
          ))}

        {level === 'chapters' &&
          chapters.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200 group"
              onClick={() => selectChapter(c)}
              onKeyDown={(event) => handleCardKey(event, () => selectChapter(c))}
              role="button"
              tabIndex={0}
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
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startPractice('chapter', c.id, c.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    loading={startingKey === `chapter:${c.id}`}
                  >
                    <Play className="h-3 w-3" /> Practice
                  </Button>
                  <ChevronRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Card>
          ))}

        {level === 'topics' &&
          topics.map((t) => (
            <Card
              key={t.id}
              className="hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/15 transition-colors">
                  <Hash className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-[var(--fg)] truncate flex-1">{t.name}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startPractice('topic', t.id, t.name)}
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
