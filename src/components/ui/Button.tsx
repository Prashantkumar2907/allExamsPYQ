import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 ease-out focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[0_1px_2px_rgba(108,195,224,0.3)] hover:shadow-md',
        secondary: 'bg-[var(--bg-surface)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)]',
        ghost: 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)]/80',
        danger: 'bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] shadow-[0_1px_2px_rgba(220,38,38,0.3)] hover:shadow-md',
        outline: 'bg-transparent text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)]/10',
        link: 'text-[var(--primary)] hover:text-[var(--primary-hover)] underline-offset-2 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export { Button, buttonVariants };
