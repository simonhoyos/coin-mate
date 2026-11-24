import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLOR_NAMES,
  CATEGORY_COLORS,
  CATEGORY_ICON_KEYS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  resolveCategoryAppearance,
} from '../category-appearance';

describe('lib/category-appearance', () => {
  describe('resolveCategoryAppearance', () => {
    it.each([
      { input: { icon: null, color: null }, reason: 'null values' },
      { input: { icon: undefined, color: undefined }, reason: 'undefined' },
      { input: {}, reason: 'empty object' },
    ])('returns the defaults for $reason', ({ input }) => {
      expect(resolveCategoryAppearance(input)).toEqual({
        icon: DEFAULT_CATEGORY_ICON,
        color: DEFAULT_CATEGORY_COLOR,
      });
    });

    it('returns the default icon for an unknown icon key', () => {
      expect(
        resolveCategoryAppearance({ icon: 'not-an-icon', color: '#ef4444' }),
      ).toEqual({ icon: DEFAULT_CATEGORY_ICON, color: '#ef4444' });
    });

    it.each(['#123456', '#EF4444', 'red'])(
      'returns the default color for non-palette color %s',
      (color) => {
        expect(resolveCategoryAppearance({ icon: 'coffee', color })).toEqual({
          icon: 'coffee',
          color: DEFAULT_CATEGORY_COLOR,
        });
      },
    );

    it('passes a valid icon key and palette color through', () => {
      expect(
        resolveCategoryAppearance({ icon: 'coffee', color: '#ef4444' }),
      ).toEqual({ icon: 'coffee', color: '#ef4444' });
    });
  });

  describe('CATEGORY_COLORS', () => {
    it('contains only lowercase #rrggbb hex values', () => {
      for (const color of CATEGORY_COLORS) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
      }
    });

    it('has no duplicates and includes the default color', () => {
      expect(new Set(CATEGORY_COLORS).size).toBe(CATEGORY_COLORS.length);
      expect(CATEGORY_COLORS).toContain(DEFAULT_CATEGORY_COLOR);
    });

    it('has a human name for every color', () => {
      for (const color of CATEGORY_COLORS) {
        expect(CATEGORY_COLOR_NAMES[color]).toEqual(expect.any(String));
        expect(CATEGORY_COLOR_NAMES[color]).not.toBe('');
      }
    });
  });

  describe('CATEGORY_ICON_KEYS', () => {
    it('has no duplicates and includes the default icon', () => {
      expect(new Set(CATEGORY_ICON_KEYS).size).toBe(CATEGORY_ICON_KEYS.length);
      expect(CATEGORY_ICON_KEYS).toContain(DEFAULT_CATEGORY_ICON);
    });
  });
});
