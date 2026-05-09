import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, ClipboardCheck, BarChart3, Trophy, CheckCircle, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../lib/constants';
import { useThemeStore } from '../stores/themeStore';

const features = [
  { icon: BookOpen, title: 'Browse Past Papers', description: 'Access previous year questions organized by exam, subject, and topic.' },
  { icon: ClipboardCheck, title: 'Practice Tests', description: 'Take timed mock tests with auto-scoring and instant feedback.' },
  { icon: BarChart3, title: 'Track Progress', description: 'Detailed analytics showing accuracy trends, score distributions.' },
  { icon: Trophy, title: 'Leaderboard', description: 'Compete with others preparing for the same exam.' },
];

export default function LandingPage() {
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme() === 'dark';

  return (
    <div className="min-h-dvh bg-[var(--bg-body)] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary-light),transparent_38%),repeating-linear-gradient(90deg,transparent,transparent_31px,var(--border)_32px)] opacity-60" />

      {/* Nav */}
      <header className="relative flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-md">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[var(--fg)]">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/15 text-[var(--primary)] text-xs font-medium mb-6">
            <CheckCircle className="h-3.5 w-3.5" />
            Free & Open Source
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--fg)] leading-[1.1]">
            {APP_NAME}
          </h1>
          <p className="text-lg text-[var(--fg-muted)] mt-5 max-w-lg mx-auto leading-relaxed">
            Master previous year questions with focused practice, timed tests, progress analytics, and admin-managed exam content.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-6">
                Start Practicing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="px-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-20 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--primary)]/15 group-hover:scale-105 transition-all duration-200">
                <f.icon className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">{f.title}</h3>
              <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 py-6 border-y border-[var(--border)]">
          {[
            { label: 'Questions', value: '10,000+' },
            { label: 'Exams Covered', value: '50+' },
            { label: 'Active Users', value: '5,000+' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-[var(--primary)]">{s.value}</p>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-[var(--border)] py-6 text-center">
        <p className="text-xs text-[var(--fg-muted)]">
          &copy; {new Date().getFullYear()} {APP_NAME}. Built for aspirants, by aspirants.
        </p>
      </footer>
    </div>
  );
}
