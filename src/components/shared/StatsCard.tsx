import { type LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn('relative flex items-center gap-4 p-4 md:p-5 overflow-hidden hover:border-[var(--border-strong)] hover:shadow-[0_2px_8px_var(--shadow)] transition duration-200 group', className)}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-gradient-to-b from-[var(--primary)] to-[var(--primary-active)] opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="h-11 w-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/15 group-hover:scale-105 transition duration-200">
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--fg-muted)] truncate mb-0.5">{title}</p>
        <p className="text-xl font-bold text-[var(--fg)] leading-tight tracking-tight">{value}</p>
        {trend && <p className="text-[11px] text-[var(--primary)] mt-0.5 font-medium">{trend}</p>}
      </div>
    </Card>
  );
}
