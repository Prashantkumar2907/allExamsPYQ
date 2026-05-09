import { cn } from '../../lib/utils';
import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-[var(--fg-muted)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'w-full text-sm rounded-lg border bg-[var(--bg-surface)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-all duration-150 focus-ring px-2.5 py-2 resize-none leading-relaxed',
            error
              ? 'border-[var(--danger)] border-l-[3px]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)] focus:border-[var(--primary)]',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };
