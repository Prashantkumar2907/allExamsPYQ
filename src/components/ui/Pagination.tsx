import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getVisiblePages(page: number, pageCount: number) {
  const start = Math.max(0, Math.min(page - 2, pageCount - 5));
  const end = Math.min(pageCount, start + 5);
  return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  if (total <= pageSize) return null;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const from = safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);
  const pages = getVisiblePages(safePage, pageCount);

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-center text-[11px] font-medium text-[var(--fg-muted)] sm:text-left">
        Showing <span className="text-[var(--fg)]">{from}-{to}</span> of <span className="text-[var(--fg)]">{total}</span>
      </p>

      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          disabled={safePage === 0}
          onClick={() => onPageChange(0)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          disabled={safePage === 0}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center gap-1 px-1">
          {pages.map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === safePage ? 'primary' : 'secondary'}
              size="icon"
              className="h-8 w-8 text-[11px]"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Page ${pageNumber + 1}`}
              aria-current={pageNumber === safePage ? 'page' : undefined}
            >
              {pageNumber + 1}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPageChange(pageCount - 1)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>
  );
}
