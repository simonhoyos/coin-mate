'use client';

import { CategoryIcon } from '@/components/category-icon';
import { CategorySwatchGrid } from '@/components/category-swatch-grid';
import {
  CATEGORY_ICON_KEYS,
  type CategoryIconKey,
  resolveCategoryAppearance,
} from '@/lib/category-appearance';

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
  return (
    <CategorySwatchGrid
      options={CATEGORY_ICON_KEYS}
      selected={resolveCategoryAppearance({ icon: props.value }).icon}
      columnsClassName="grid-cols-7"
      fallbackLabel="Category icon"
      aria-labelledby={props['aria-labelledby']}
      getLabel={getIconLabel}
      onChange={props.onChange}
      renderOption={(key) => (
        <CategoryIcon icon={key} color={props.color} size={32} />
      )}
    />
  );
}
