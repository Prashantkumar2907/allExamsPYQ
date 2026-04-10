import { cn } from '../../lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-sm transition-all duration-150 hover:shadow-md hover:border-[var(--border-strong)]',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between mb-2.5 pb-2.5 border-b border-[var(--border)]', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-[15px] font-semibold text-[var(--fg)]', className)} {...props} />
  )
);

CardTitle.displayName = 'CardTitle';

export { Card, CardHeader, CardTitle };
