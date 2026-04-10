import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({ value, onValueChange, options, placeholder = 'Select...', label, className }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-[var(--fg-muted)]">{label}</label>}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            'inline-flex items-center justify-between w-full h-9 px-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--fg)] hover:border-[var(--border-strong)] transition-all duration-150 focus-ring cursor-pointer',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl animate-scale-in z-50"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1 max-h-56">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex items-center h-8 px-6 text-sm rounded-md text-[var(--fg)] cursor-pointer select-none hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] data-[state=checked]:text-[var(--primary)] data-[state=checked]:font-medium outline-none transition-colors duration-100"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute left-1.5">
                    <Check className="h-3 w-3 text-[var(--primary)]" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
