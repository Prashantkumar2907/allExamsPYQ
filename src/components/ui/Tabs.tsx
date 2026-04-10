import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue || items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsPrimitive.List className="flex gap-1 border-b border-[var(--border)] mb-3">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'relative px-3.5 py-2 text-[13px] font-medium text-[var(--fg-muted)] transition-colors duration-150 cursor-pointer hover:text-[var(--fg)]',
              'data-[state=active]:text-[var(--primary)]',
              'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--primary)] after:scale-x-0 after:transition-transform after:duration-200 after:ease-out after:origin-center',
              'data-[state=active]:after:scale-x-100'
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.value} value={item.value} className="animate-fade-in">
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
