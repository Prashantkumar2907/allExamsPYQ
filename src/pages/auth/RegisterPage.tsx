import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, BookOpen, Sun, Moon, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';
import { isSupabaseConfigured } from '../../lib/env';
import type { Exam } from '../../types/database';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState('');
  const { signUp, loading } = useAuthStore();
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme() === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('exams')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setExams(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await signUp(email, password, fullName, examId || undefined);
    if (error) {
      setError(error);
    } else {
      navigate('/dashboard');
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-400'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="h-dvh flex items-center justify-center p-4 bg-[var(--bg-body)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)/8,transparent_60%)]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--primary)]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="w-full max-w-md animate-fade-in relative">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-lg">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-active)] mb-3 shadow-md">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--fg)]">{APP_NAME}</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSupabaseConfigured && (
              <div className="text-xs text-[var(--warning)] bg-[var(--warning)]/10 px-3 py-2 rounded-lg">
                Supabase is not configured. Copy .env.example to .env.local and set the local or hosted keys before creating accounts.
              </div>
            )}
            {/* Account Details Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--fg-muted)]">
                <div className="h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold">1</div>
                Account Details
              </div>
              <Input
                id="fullName"
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                icon={User}
              />
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                icon={Mail}
              />
              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  icon={Lock}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-[30px] h-7 w-7 flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--fg-subtle)]">
                    {strengthLabels[passwordStrength]} {password.length < 6 && '— minimum 6 characters'}
                  </p>
                </div>
              )}
            </div>

            {/* Exam Selection Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--fg-muted)]">
                <div className="h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold">2</div>
                Choose Your Exam
              </div>
              <div className="relative">
                <Select
                  label="Exam (optional)"
                  value={examId}
                  onValueChange={setExamId}
                  options={exams.map((e) => ({ value: e.id, label: e.name }))}
                  placeholder="Choose your exam"
                />
                {!examId && (
                  <p className="text-[11px] text-[var(--fg-subtle)] mt-1.5 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    You can always change this later
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="text-xs text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        <div className="text-center mt-5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60">
          <p className="text-sm text-[var(--fg-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
