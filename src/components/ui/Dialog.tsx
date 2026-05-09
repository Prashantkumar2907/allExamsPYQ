import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideDescription?: boolean;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, hideDescription = false, children, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85vh] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xl overflow-y-auto data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out',
            className
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <DialogPrimitive.Title className="text-sm font-semibold text-[var(--fg)]">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className={description && !hideDescription ? 'text-xs text-[var(--fg-muted)] mt-0.5' : 'sr-only'}>
                {description ?? `${title} dialog`}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 focus-ring"
              aria-label="Close dialog"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
