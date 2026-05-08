export function LoadingSpinner({ className, skeleton }: { className?: string; skeleton?: boolean }) {
  if (skeleton) {
    return (
      <div className={`space-y-4 ${className ?? 'py-8 px-1'}`} role="status" aria-live="polite">
        <div className="h-5 w-2/5 rounded-lg animate-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="h-48 rounded-xl animate-shimmer" style={{ animationDelay: '200ms' }} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className ?? 'py-16'}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--primary)] animate-spin" />
      </div>
      <span className="text-xs text-[var(--fg-subtle)] animate-pulse-soft">Loading...</span>
    </div>
  );
}
