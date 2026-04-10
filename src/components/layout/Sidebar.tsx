import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { APP_NAME } from '../../lib/constants';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Trophy,
  Bookmark,
  User,
  Settings,
  FileQuestion,
  Upload,
  AlertTriangle,
  Users,
  X,
  GraduationCap,
  LogOut,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const studentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exams', icon: BookOpen, label: 'Exam Browser' },
  { to: '/tests', icon: ClipboardList, label: 'Tests' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/exams', icon: BookOpen, label: 'Exams' },
  { to: '/admin/questions', icon: FileQuestion, label: 'Questions' },
  { to: '/admin/tests', icon: ClipboardList, label: 'Tests' },
  { to: '/admin/upload', icon: Upload, label: 'Bulk Upload' },
  { to: '/admin/reports', icon: AlertTriangle, label: 'Reported' },
  { to: '/admin/users', icon: Users, label: 'User Analytics' },
  { to: '/admin/profile', icon: Settings, label: 'Profile' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const nav = isAdmin ? adminNav : studentNav;

  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border)] transition-transform duration-200 ease-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-active)] flex items-center justify-center shadow-sm">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-[var(--fg)] leading-tight">{APP_NAME}</span>
            <span className="text-[10px] text-[var(--fg-subtle)] leading-tight">{isAdmin ? 'Admin' : 'Student'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {nav.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/dashboard' && item.to !== '/admin' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary)] animate-scale-in" />
              )}
              <item.icon className={cn('h-[18px] w-[18px] flex-shrink-0 transition-colors', isActive && 'text-[var(--primary)]')} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User card footer */}
      <div className="px-3 py-3 border-t border-[var(--border)] space-y-1">
        {profile && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--fg)] truncate">{profile.full_name}</p>
              <p className="text-[10px] text-[var(--fg-subtle)] truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={async () => { setSigningOut(true); await signOut(); }}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {signingOut ? <Loader2 className="h-[18px] w-[18px] animate-spin flex-shrink-0" /> : <LogOut className="h-[18px] w-[18px] flex-shrink-0" />}
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
