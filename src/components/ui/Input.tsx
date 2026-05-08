import { cn } from '../../lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[var(--fg-muted)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)] pointer-events-none" />
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full h-9 text-sm rounded-xl border bg-[var(--bg-surface)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-all duration-200 focus-ring',
            Icon ? 'pl-8 pr-2.5' : 'px-2.5',
            error ? 'border-[var(--danger)] border-l-[3px]' : 'border-[var(--border)] hover:border-[var(--border-strong)] focus:border-[var(--primary)]',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export { Input };
