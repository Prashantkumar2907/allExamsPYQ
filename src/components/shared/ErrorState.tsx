import { AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Unable to load this view',
  description,
  actionLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center py-12 text-center animate-fade-in" role="alert" aria-live="polite">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/15">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mb-1 text-base font-semibold text-[var(--fg)]">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--fg-muted)]">{description}</p>
      {onRetry && (
        <Button className="mt-5" size="sm" variant="secondary" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
