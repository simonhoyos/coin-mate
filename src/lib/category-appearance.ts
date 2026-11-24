import { z } from 'zod';

export const CATEGORY_ICON_KEYS = [
  'category',
  'shopping-cart',
  'tools-kitchen-2',
  'coffee',
  'home',
  'car',
  'bus',
  'gas-station',
  'plane',
  'heart',
  'first-aid-kit',
  'pill',
  'school',
  'book',
  'briefcase',
  'cash',
  'credit-card',
  'pig-money',
  'receipt',
  'gift',
  'shirt',
  'device-gamepad-2',
  'device-mobile',
  'device-tv',
  'wifi',
  'bolt',
  'droplet',
  'paw',
  'barbell',
  'movie',
  'music',
  'beer',
  'building-bank',
  'tool',
  'bike',
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const CATEGORY_COLORS = [
  '#6b7280',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const CATEGORY_COLOR_NAMES: Record<CategoryColor, string> = {
  '#6b7280': 'Grey',
  '#ef4444': 'Red',
  '#f97316': 'Orange',
  '#f59e0b': 'Amber',
  '#eab308': 'Yellow',
  '#22c55e': 'Green',
  '#14b8a6': 'Teal',
  '#06b6d4': 'Cyan',
  '#3b82f6': 'Blue',
  '#6366f1': 'Indigo',
  '#a855f7': 'Purple',
  '#ec4899': 'Pink',
};

export const DEFAULT_CATEGORY_ICON: CategoryIconKey = 'category';
export const DEFAULT_CATEGORY_COLOR: CategoryColor = '#6b7280';

export function isCategoryIconKey(value: unknown): value is CategoryIconKey {
  return (CATEGORY_ICON_KEYS as readonly unknown[]).includes(value);
}

export function isCategoryColor(value: unknown): value is CategoryColor {
  return (CATEGORY_COLORS as readonly unknown[]).includes(value);
}

export function resolveCategoryAppearance(args: {
  icon?: string | null | undefined;
  color?: string | null | undefined;
}): { icon: CategoryIconKey; color: CategoryColor } {
  return {
    icon: isCategoryIconKey(args.icon) ? args.icon : DEFAULT_CATEGORY_ICON,
    color: isCategoryColor(args.color) ? args.color : DEFAULT_CATEGORY_COLOR,
  };
}

export const CategoryIconSchema = z.string().refine(isCategoryIconKey);
export const CategoryColorSchema = z.string().refine(isCategoryColor);
