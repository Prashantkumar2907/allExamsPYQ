import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium leading-none transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)]/15 text-[var(--primary)]',
        success: 'bg-green-500/20 text-green-700 dark:text-green-400',
        warning: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
        danger: 'bg-red-500/20 text-red-700 dark:text-red-400',
        muted: 'bg-[var(--fg-muted)]/10 text-[var(--fg-muted)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const dotColors: Record<string, string> = {
  default: 'bg-[var(--primary)]',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  muted: 'bg-[var(--fg-muted)]',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant || 'default'])} />}
      {children}
    </span>
  );
}
