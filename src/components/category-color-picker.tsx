'use client';

import { CategoryIcon } from '@/components/category-icon';
import {
  CATEGORY_COLOR_NAMES,
  CATEGORY_COLORS,
  type CategoryColor,
  resolveCategoryAppearance,
} from '@/lib/category-appearance';
import { cn } from '@/lib/utils';

export function CategoryColorPicker(props: {
  value?: string | null;
  icon?: string | null;
  onChange: (color: CategoryColor) => void;
  'aria-labelledby'?: string;
}) {
  const selected = resolveCategoryAppearance({ color: props.value }).color;
  const labelledBy = props['aria-labelledby'];

  return (
    <fieldset
      aria-labelledby={labelledBy}
      aria-label={labelledBy == null ? 'Category color' : undefined}
      className="m-0 grid min-w-0 border-0 p-0 grid grid-cols-6 gap-2"
    >
      {CATEGORY_COLORS.map((hex) => (
        <button
          key={hex}
          type="button"
          aria-label={CATEGORY_COLOR_NAMES[hex]}
          aria-pressed={hex === selected}
          onClick={() => props.onChange(hex)}
          className={cn(
            'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            hex === selected &&
              'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
        >
          <CategoryIcon icon={props.icon ?? null} color={hex} size={32} />
        </button>
      ))}
    </fieldset>
  );
}
