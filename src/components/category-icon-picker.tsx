'use client';

import { CategoryIcon } from '@/components/category-icon';
import {
  CATEGORY_ICON_KEYS,
  type CategoryIconKey,
  resolveCategoryAppearance,
} from '@/lib/category-appearance';
import { cn } from '@/lib/utils';

function getIconLabel(key: string): string {
  return key
    .split('-')
    .filter((part) => !/^\d+$/.test(part))
    .join(' ');
}

export function CategoryIconPicker(props: {
  value?: string | null;
  color?: string | null;
  onChange: (key: CategoryIconKey) => void;
  'aria-labelledby'?: string;
}) {
  const selected = resolveCategoryAppearance({ icon: props.value }).icon;
  const labelledBy = props['aria-labelledby'];

  return (
    <fieldset
      aria-labelledby={labelledBy}
      aria-label={labelledBy == null ? 'Category icon' : undefined}
      className="m-0 grid min-w-0 border-0 p-0 grid grid-cols-7 gap-2"
    >
      {CATEGORY_ICON_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={getIconLabel(key)}
          aria-pressed={key === selected}
          onClick={() => props.onChange(key)}
          className={cn(
            'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            key === selected &&
              'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
        >
          <CategoryIcon icon={key} color={props.color ?? null} size={32} />
        </button>
      ))}
    </fieldset>
  );
}
