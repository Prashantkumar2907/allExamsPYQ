import { cn } from '../../lib/utils';
import { getAvatarUrl } from '../../lib/avatarConfig';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
};

const dotSizes = {
  sm: 'h-2 w-2 right-0 bottom-0',
  md: 'h-2.5 w-2.5 right-0 bottom-0',
  lg: 'h-3 w-3 right-0.5 bottom-0.5',
};

export function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = src || getAvatarUrl('adventurer', name);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-visible flex-shrink-0',
        sizes[size],
        className
      )}
    >
      <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-[var(--border)] bg-[var(--primary)]/10">
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            el.parentElement!.setAttribute('data-fallback', 'true');
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-semibold text-[var(--primary)] pointer-events-none opacity-0 data-[fallback=true]:opacity-100">
          {initials}
        </div>
      </div>
      {online != null && (
        <span
          className={cn(
            'absolute block rounded-full ring-2 ring-[var(--bg-surface)]',
            online ? 'bg-green-500' : 'bg-[var(--fg-subtle)]',
            dotSizes[size]
          )}
        />
      )}
    </div>
  );
}
