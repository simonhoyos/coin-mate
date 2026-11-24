'use client';

import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  useWatch,
} from 'react-hook-form';
import { CategoryColorPicker } from '@/components/category-color-picker';
import { CategoryIconPicker } from '@/components/category-icon-picker';
import { Field, FieldLabel } from '@/components/ui/field';

type AppearanceValues = FieldValues & {
  icon: string | null;
  color: string | null;
};

export function CategoryAppearanceFields<T extends AppearanceValues>(props: {
  control: Control<T>;
  idPrefix: string;
}) {
  const iconName = 'icon' as Path<T>;
  const colorName = 'color' as Path<T>;
  const icon = useWatch({ control: props.control, name: iconName }) as
    | string
    | null;
  const color = useWatch({ control: props.control, name: colorName }) as
    | string
    | null;
  const iconLabelId = `${props.idPrefix}-icon-label`;
  const colorLabelId = `${props.idPrefix}-color-label`;

  return (
    <>
      <Controller
        name={iconName}
        control={props.control}
        render={({ field }) => (
          <Field>
            <FieldLabel id={iconLabelId}>Icon</FieldLabel>
            <CategoryIconPicker
              aria-labelledby={iconLabelId}
              value={field.value}
              color={color}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
      <Controller
        name={colorName}
        control={props.control}
        render={({ field }) => (
          <Field>
            <FieldLabel id={colorLabelId}>Color</FieldLabel>
            <CategoryColorPicker
              aria-labelledby={colorLabelId}
              value={field.value}
              icon={icon}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
    </>
  );
}
