import { describe, expect, it } from 'vitest';
import { getObjectDiff } from '../diff';

describe('lib/diff', () => {
  it('compares two objects and return the changing keys only', () => {
    const base = { a: 1, b: 2, c: { d: 3, e: { f: { g: 5 } } }, h: 6 };
    const updated = { a: 1, b: 9, c: { d: 4, f: { h: 6 } } };

    const result = getObjectDiff(base, updated);

    expect(result).toEqual({
      b: 9,
      c: { d: 4, f: { h: 6 } },
    });
  });
});
