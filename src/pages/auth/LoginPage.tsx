import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signIn, loading } = useAuthStore();
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme() === 'dark';
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
    } else {
      navigate('/dashboard');
    }
  };

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

      <div className="w-full max-w-sm animate-fade-in relative">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-lg">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-active)] mb-3 shadow-md">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--fg)]">{APP_NAME}</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Welcome back! Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                autoComplete="current-password"
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

            {error && (
              <div className="text-xs text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
        </div>

        <div className="text-center mt-5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60">
          <p className="text-sm text-[var(--fg-muted)]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold hover:underline transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
