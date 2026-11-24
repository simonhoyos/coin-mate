'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CategorySwatchGrid<T extends string>(props: {
  options: readonly T[];
  selected: T;
  columnsClassName: string;
  fallbackLabel: string;
  'aria-labelledby'?: string | undefined;
  getLabel: (option: T) => string;
  onChange: (option: T) => void;
  renderOption: (option: T) => ReactNode;
}) {
  const labelledBy = props['aria-labelledby'];

  return (
    <fieldset
      aria-labelledby={labelledBy}
      aria-label={labelledBy == null ? props.fallbackLabel : undefined}
      className={cn(
        'm-0 grid min-w-0 gap-2 border-0 p-0',
        props.columnsClassName,
      )}
    >
      {props.options.map((option) => (
        <button
          key={option}
          type="button"
          aria-label={props.getLabel(option)}
          aria-pressed={option === props.selected}
          onClick={() => props.onChange(option)}
          className={cn(
            'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            option === props.selected &&
              'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
        >
          {props.renderOption(option)}
        </button>
      ))}
    </fieldset>
  );
}
