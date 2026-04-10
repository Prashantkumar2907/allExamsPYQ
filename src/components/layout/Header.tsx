import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, ChevronDown, User, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const { profile, signOut, user } = useAuthStore();
  const { title, description } = usePageStore();
  const isDark = resolvedTheme() === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-13 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        {title && (
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[var(--fg)] truncate leading-tight">{title}</h1>
            {description && <p className="text-[11px] text-[var(--fg-muted)] truncate leading-tight">{description}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {(profile || user) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-hover)]/60 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <Avatar src={profile?.avatar_url} name={profile?.full_name || user?.email || 'User'} size="sm" />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium text-[var(--fg)] max-w-28 truncate leading-tight">
                  {profile?.full_name || user?.email || 'User'}
                </span>
                {profile?.role && (
                  <span className="text-[10px] text-[var(--fg-subtle)] leading-tight capitalize">
                    {profile.role}
                  </span>
                )}
              </div>
              <ChevronDown className={`hidden sm:block h-3 w-3 text-[var(--fg-subtle)] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl animate-scale-in z-50 overflow-hidden">
                <div className="p-3 border-b border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--fg)] truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[11px] text-[var(--fg-muted)] truncate">{profile?.email || user?.email}</p>
                </div>
                <div className="p-1">
                  {profile && (
                    <button
                      onClick={() => { setMenuOpen(false); navigate(profile.role === 'admin' ? '/admin/profile' : '/profile'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg-muted)] rounded-lg hover:bg-[var(--bg-surface-hover)] hover:text-[var(--fg)] transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                  )}
                  <button
                    onClick={async () => { setSigningOut(true); setMenuOpen(false); await signOut(); }}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
