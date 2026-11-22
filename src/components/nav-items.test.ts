import { describe, expect, it } from 'vitest';
import { navItems } from './nav-items';

describe('navItems', () => {
  it('lists Dashboard, History, Categories and Spaces in sidebar order', () => {
    expect(navItems.map((item) => [item.title, item.url])).toEqual([
      ['Dashboard', '/dashboard'],
      ['History', '/dashboard/history'],
      ['Categories', '/dashboard/categories'],
      ['Spaces', '/dashboard/spaces'],
    ]);
  });

  it('gives every item an icon', () => {
    for (const item of navItems) {
      expect(item.icon).toBeDefined();
    }
  });
});
