'use client';

import { CategoryIcon } from '@/components/category-icon';
import { CategorySwatchGrid } from '@/components/category-swatch-grid';
import {
  CATEGORY_COLOR_NAMES,
  CATEGORY_COLORS,
  type CategoryColor,
  resolveCategoryAppearance,
} from '@/lib/category-appearance';

export function CategoryColorPicker(props: {
  value?: string | null;
  icon?: string | null;
  onChange: (color: CategoryColor) => void;
  'aria-labelledby'?: string;
}) {
  return (
    <CategorySwatchGrid
      options={CATEGORY_COLORS}
      selected={resolveCategoryAppearance({ color: props.value }).color}
      columnsClassName="grid-cols-6"
      fallbackLabel="Category color"
      aria-labelledby={props['aria-labelledby']}
      getLabel={(hex) => CATEGORY_COLOR_NAMES[hex]}
      onChange={props.onChange}
      renderOption={(hex) => (
        <CategoryIcon icon={props.icon} color={hex} size={32} />
      )}
    />
  );
}
