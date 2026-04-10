import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/shared/EmptyState';
import { cn, formatDate } from '../../lib/utils';
import { Users, Search } from 'lucide-react';

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  role: string;
  exam_id: string | null;
  created_at: string;
  exam?: { name: string } | null;
}

export default function UserAnalyticsPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 50;

  useEffect(() => { setPage('User Analytics', 'Monitor student performance'); loadStudents(); }, []);

  async function loadStudents(append = false) {
    const from = append ? students.length : 0;
    const { data, count } = await supabase
      .from('profiles')
      .select('*, exam:exams(name)', { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (data) {
      setStudents(prev => append ? [...prev, ...(data as StudentProfile[])] : data as StudentProfile[]);
      setHasMore(data.length === PAGE_SIZE);
    }
    if (count != null) setTotalCount(count);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 w-1/3 rounded-lg animate-shimmer" />
        <div className="h-10 rounded-lg animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
      </div>
    );
  }

  const filtered = search
    ? students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg)]">Students</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">Manage and view registered students</p>
        </div>
        <Badge variant="default">{totalCount} total</Badge>
      </div>

      {/* Search */}
      <Card className="!p-0 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent text-sm text-[var(--fg)] focus:outline-none placeholder:text-[var(--fg-muted)]"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search term.' : 'No students registered yet.'} />
      ) : (
        <div className="grid gap-2">
          {filtered.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 cursor-pointer hover:-translate-y-[1px] hover:shadow-md hover:border-[var(--primary)]/30 transition-all">
              <Avatar name={s.full_name} src={s.avatar_url || undefined} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--fg)] truncate">{s.full_name}</p>
                <p className="text-xs text-[var(--fg-muted)] truncate">{s.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.exam?.name && (
                  <Badge variant="default">{s.exam.name}</Badge>
                )}
                <span className="text-[10px] text-[var(--fg-muted)]">{formatDate(s.created_at)}</span>
              </div>
            </Card>
          ))}
          {hasMore && !search && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => loadStudents(true)}>
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
