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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)/6,transparent_60%)]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/4 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--primary)]/4 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

      {/* Nav */}
      <header className="relative flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-active)] flex items-center justify-center shadow-md">
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
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--fg)] tracking-tight leading-[1.1]">
            Master Your Exams with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--primary-active)]">
              Previous Year Questions
            </span>
          </h1>
          <p className="text-lg text-[var(--fg-muted)] mt-5 max-w-lg mx-auto leading-relaxed">
            Practice with real exam questions, track your performance, and compete with fellow aspirants. All in one clean, fast platform.
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
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--primary)]/15 group-hover:scale-105 transition-all duration-200">
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
