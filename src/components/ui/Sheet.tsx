import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-0 right-0 z-50 h-dvh w-[min(28rem,100vw-2rem)] border-l border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-y-auto',
            'data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right',
            className
          )}
        >
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] z-10">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-sm font-semibold text-[var(--fg)] truncate">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-[var(--fg-muted)] mt-0.5 truncate">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="ml-2 h-7 w-7 inline-flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>
          <div className="p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
