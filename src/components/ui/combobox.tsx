'use client';

import { IconCheck, IconSelector, IconX } from '@tabler/icons-react';
import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  const selectedLabels = React.useMemo(() => {
    return value
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean);
  }, [value, options]);

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  function removeOption(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex min-h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, i) => (
                <span
                  key={value[i]}
                  className="bg-secondary text-secondary-foreground inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium"
                >
                  {label}
                  <button
                    type="button"
                    className="hover:text-foreground ml-0.5 rounded-sm opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();

                      const valueToRemove = value.at(i);

                      if (valueToRemove == null) return;

                      removeOption(valueToRemove);
                    }}
                  >
                    <IconX className="size-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="flex flex-col">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-b px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-center text-sm">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50',
                    )}
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                        isSelected && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {isSelected && <IconCheck className="size-3" />}
                    </div>
                    <span>{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
