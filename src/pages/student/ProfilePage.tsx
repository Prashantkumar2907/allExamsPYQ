import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Sheet } from '../../components/ui/Sheet';
import { getAvatarUrl, AVATAR_STYLES, type AvatarStyle } from '../../lib/avatarConfig';
import { cn } from '../../lib/utils';
import {
  Save, CheckCircle, Bookmark, Pencil, Phone, UserRound,
  BookOpen, ArrowRight, Camera, Award, Target, Hash, Flame,
} from 'lucide-react';
import type { Exam, Bookmark as BookmarkType, Question, Option } from '../../types/database';

interface BookmarkWithQuestion extends BookmarkType {
  question: Question & { options: Option[] };
}

export default function ProfilePage() {
  const { profile, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<BookmarkWithQuestion[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [stats, setStats] = useState({ rank: 0, points: 0, accuracy: 0, testsCount: 0, streak: 0 });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [examId, setExamId] = useState(profile?.exam_id || '');

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>(
    AVATAR_STYLES.find((s) => profile?.avatar_url?.includes(s)) || AVATAR_STYLES[0]
  );
  const [tempAvatarStyle, setTempAvatarStyle] = useState<AvatarStyle>(avatarStyle);

  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkWithQuestion | null>(null);

  const setPage = usePageStore((s) => s.setPage);

  useEffect(() => {
    setPage('Profile', 'View and manage your profile');
    if (profile) loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [examsRes, bmRes, attemptsRes, lbRes] = await Promise.all([
        supabase.from('exams').select('*').eq('is_active', true).order('name'),
        supabase.from('bookmarks').select('*, question:questions(*, options(*))', { count: 'exact' })
          .eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('test_attempts').select('*')
          .eq('user_id', profile!.id).eq('status', 'completed'),
        profile?.exam_id
          ? supabase.from('leaderboard_scores').select('*').eq('user_id', profile!.id).eq('exam_id', profile!.exam_id).single()
          : Promise.resolve({ data: null }),
      ]);
      if (examsRes.data) setExams(examsRes.data);
      if (bmRes.data) setRecentBookmarks(bmRes.data as BookmarkWithQuestion[]);
      if (bmRes.count != null) setBookmarkCount(bmRes.count);

      const attempts = attemptsRes.data || [];
      const totalCorrect = attempts.reduce((a, b) => a + (b.correct_answers || 0), 0);
      const totalQuestions = attempts.reduce((a, b) => a + (b.total_questions || 0), 0);
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const points = lbRes.data?.total_score || attempts.reduce((a, b) => a + (b.score || 0), 0);

      let streak = 0;
      if (attempts.length > 0) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const testDays = new Set(attempts.map(a => { const d = new Date(a.completed_at || a.started_at); d.setHours(0, 0, 0, 0); return d.getTime(); }));
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() - i);
          if (testDays.has(checkDate.getTime())) streak++; else if (i > 0) break;
        }
      }

      setStats({ rank: 0, points, accuracy, testsCount: attempts.length, streak });

      if (profile?.exam_id && lbRes.data) {
        const { count } = await supabase.from('leaderboard_scores').select('id', { count: 'exact', head: true })
          .eq('exam_id', profile.exam_id).gt('total_score', lbRes.data.total_score);
        setStats(prev => ({ ...prev, rank: (count || 0) + 1 }));
      }
    } catch (err) { console.error('Failed to load profile data:', err); }
    finally { setLoading(false); }
  }

  function openEditDialog() {
    setFullName(profile?.full_name || ''); setPhone(profile?.phone || '');
    setBio(profile?.bio || ''); setExamId(profile?.exam_id || '');
    setEditDialogOpen(true);
  }

  function openAvatarDialog() { setTempAvatarStyle(avatarStyle); setAvatarDialogOpen(true); }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const avatarUrl = getAvatarUrl(avatarStyle, fullName);
      const { error } = await updateProfile({ full_name: fullName, phone: phone || null, bio: bio || null, avatar_url: avatarUrl, exam_id: examId || null });
      if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); setEditDialogOpen(false); }
    } finally { setSaving(false); }
  }

  function handleSaveAvatar() { setAvatarStyle(tempAvatarStyle); setAvatarDialogOpen(false); }

  if (!profile || loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="rounded-xl animate-shimmer h-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 80}ms` }} />)}
        </div>
        <div className="h-48 rounded-xl animate-shimmer" />
      </div>
    );
  }

  const selectedExam = exams.find((e) => e.id === (profile.exam_id || examId));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile Hero Card */}
      <Card className="relative overflow-hidden !p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--primary)]/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group cursor-pointer" onClick={openAvatarDialog}>
              <Avatar name={profile.full_name} src={getAvatarUrl(avatarStyle, profile.full_name)} size="lg" className="!h-24 !w-24 ring-4 !ring-[var(--primary)]/20 shadow-lg" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--fg)]">{profile.full_name}</h1>
                {stats.streak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-500 px-2.5 py-0.5 text-xs font-semibold">
                    <Flame className="h-3.5 w-3.5" /> {stats.streak} Day Streak
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--fg-muted)]">{profile.bio || profile.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {selectedExam && <Badge dot className="text-xs"><BookOpen className="h-3 w-3 mr-1" /> {selectedExam.name}</Badge>}
                {profile.phone && <Badge variant="muted" className="text-xs"><Phone className="h-3 w-3 mr-1" /> {profile.phone}</Badge>}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openEditDialog} className="shrink-0">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[var(--border)]/50">
            {[
              { label: 'RANK', value: stats.rank > 0 ? `#${stats.rank}` : '—', icon: Award },
              { label: 'POINTS', value: stats.points.toLocaleString(), icon: Target },
              { label: 'ACCURACY', value: `${stats.accuracy}%`, icon: CheckCircle },
              { label: 'TESTS', value: stats.testsCount, icon: Hash },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border)]/50">
                <div className="h-9 w-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-bold text-[var(--fg)] leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Bookmarks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">Recent Bookmarks</h2>
            {bookmarkCount > 0 && <Badge variant="muted" className="text-[10px]">{bookmarkCount}</Badge>}
          </div>
          {bookmarkCount > 0 && (
            <Link to="/bookmarks" className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {recentBookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentBookmarks.map((bm) => {
              const q = bm.question;
              return (
                <Card key={bm.id} className="cursor-pointer group hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200" onClick={() => setSelectedBookmark(bm)}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={q?.difficulty === 'easy' ? 'success' : q?.difficulty === 'hard' ? 'danger' : 'warning'} className="text-[10px]">{q?.difficulty}</Badge>
                      <span className="text-[10px] text-[var(--fg-muted)]">{q?.year || ''}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--fg)] line-clamp-2 leading-relaxed">{q?.question_text || 'Question'}</p>
                    <p className="text-xs text-[var(--fg-muted)] line-clamp-1">{bm.notes || 'No notes added'}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-2 py-10">
            <div className="h-12 w-12 rounded-full bg-[var(--fg-muted)]/10 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-[var(--fg-muted)]" />
            </div>
            <p className="text-sm text-[var(--fg-muted)] font-medium">No bookmarks yet</p>
            <p className="text-xs text-[var(--fg-subtle)]">Bookmark questions during test reviews to see them here</p>
          </Card>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen} title="Edit Profile" description="Update your personal information and academic preferences.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input id="edit-name" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={UserRound} />
            <Input id="edit-phone" label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" icon={Phone} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] mb-1.5 uppercase tracking-wider"><BookOpen className="h-3 w-3" /> Target Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-colors hover:border-[var(--border-strong)] cursor-pointer">
              <option value="">Select exam</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] mb-1.5 uppercase tracking-wider"><UserRound className="h-3 w-3" /> Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-colors hover:border-[var(--border-strong)] resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="secondary" size="md" onClick={() => setEditDialogOpen(false)}>Discard Changes</Button>
            <Button size="md" onClick={handleSaveProfile} disabled={saving || !fullName.trim()} loading={saving}>
              {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Profile</>}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Avatar Selection Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen} title="Choose Avatar" description="Select a professional avatar style">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar name={profile.full_name} src={getAvatarUrl(tempAvatarStyle, profile.full_name)} size="lg" className="!h-20 !w-20 ring-4 !ring-[var(--primary)]/20" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_STYLES.map((style) => (
              <button key={style} onClick={() => setTempAvatarStyle(style)} className={cn('relative rounded-xl border-2 p-2 transition-all duration-200 cursor-pointer', tempAvatarStyle === style ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-105 shadow-md' : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-surface-hover)]')}>
                <img src={getAvatarUrl(style, profile.full_name)} alt={style} className="h-14 w-14 rounded-lg mx-auto" />
                {tempAvatarStyle === style && <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm"><CheckCircle className="h-3 w-3 text-white" /></div>}
                <p className="text-[9px] text-[var(--fg-muted)] text-center mt-1 truncate">{style}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="secondary" size="sm" onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveAvatar}><CheckCircle className="h-3.5 w-3.5" /> Select Avatar</Button>
          </div>
        </div>
      </Dialog>

      {/* Bookmark Detail Sheet */}
      <Sheet open={!!selectedBookmark} onOpenChange={(open) => { if (!open) setSelectedBookmark(null); }} title="Bookmark Detail">
        {selectedBookmark && (() => {
          const q = selectedBookmark.question;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {q.year && <Badge variant="default" className="text-[10px]">{q.year}</Badge>}
                <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'} className="text-[10px]">{q.difficulty}</Badge>
                <span className="text-[10px] text-[var(--fg-muted)]">+{q.marks} / -{q.negative_marks} marks</span>
              </div>
              <p className="text-sm text-[var(--fg)] leading-relaxed font-medium">{q.question_text}</p>
              <div className="space-y-2">
                {q.options?.sort((a, b) => a.sort_order - b.sort_order).map((opt, i) => {
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
              {q.explanation && (
                <div className="rounded-lg bg-[var(--primary)]/8 border border-[var(--primary)]/15 p-3">
                  <p className="text-xs font-semibold text-[var(--primary)] mb-1">💡 Explanation</p>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{q.explanation}</p>
                </div>
              )}
              {selectedBookmark.notes && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
                  <p className="text-xs font-semibold text-amber-600 mb-1">📝 My Notes</p>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{selectedBookmark.notes}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}