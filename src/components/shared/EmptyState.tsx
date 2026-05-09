import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-lg bg-[var(--primary)]/8 flex items-center justify-center mb-4 ring-1 ring-[var(--primary)]/10">
        <Icon className="h-7 w-7 text-[var(--primary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--fg)] mb-1.5">{title}</h3>
      {description && <p className="text-sm text-[var(--fg-muted)] max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
