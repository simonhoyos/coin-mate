import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CATEGORY_ICON_KEYS } from '@/lib/category-appearance';
import { CategoryIcon } from './category-icon';

function renderCircle(props: Parameters<typeof CategoryIcon>[0]) {
  const { container } = render(<CategoryIcon {...props} />);
  const circle = container.querySelector<HTMLElement>(
    '[data-slot="category-icon"]',
  );
  const svg = circle?.querySelector('svg') ?? null;
  return { circle, svg };
}

describe('CategoryIcon', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the icon for a given key inside the circle', () => {
    const { circle, svg } = renderCircle({ icon: 'shopping-cart' });

    expect(circle).not.toBeNull();
    expect(svg?.classList.contains('tabler-icon-shopping-cart')).toBe(true);
  });

  it('uses the given color as the circle background', () => {
    const { circle } = renderCircle({
      icon: 'shopping-cart',
      color: '#ef4444',
    });

    expect(circle?.style.backgroundColor).toBe('rgb(239, 68, 68)');
  });

  it('renders the generic icon on grey for null values', () => {
    const { circle, svg } = renderCircle({ icon: null, color: null });

    expect(svg?.classList.contains('tabler-icon-category')).toBe(true);
    expect(circle?.style.backgroundColor).toBe('rgb(107, 114, 128)');
  });

  it('falls back to the defaults for unknown icon and color', () => {
    const { circle, svg } = renderCircle({
      icon: 'not-an-icon',
      color: '#123456',
    });

    expect(svg?.classList.contains('tabler-icon-category')).toBe(true);
    expect(circle?.style.backgroundColor).toBe('rgb(107, 114, 128)');
  });

  it('draws a dark icon on a light swatch', () => {
    const { svg } = renderCircle({ icon: 'category', color: '#eab308' });

    expect(svg?.getAttribute('stroke')).toBe('#111827');
  });

  it.each(['#6b7280', '#ef4444'])('draws a white icon on %s', (color) => {
    const { svg } = renderCircle({ icon: 'category', color });

    expect(svg?.getAttribute('stroke')).toBe('#ffffff');
  });

  it('sets the circle size from the size prop', () => {
    const { circle } = renderCircle({ icon: 'category', size: 24 });

    expect(circle?.style.width).toBe('24px');
    expect(circle?.style.height).toBe('24px');
  });

  it.each([...CATEGORY_ICON_KEYS])('renders its own icon for %s', (key) => {
    const { svg } = renderCircle({ icon: key });

    expect(svg?.classList.contains(`tabler-icon-${key}`)).toBe(true);
  });
});
