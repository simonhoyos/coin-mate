import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile, useIsMobileResolved } from './use-mobile';

function setup(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function capture<T>(useValue: () => T) {
  const seen: T[] = [];
  function Probe() {
    seen.push(useValue());
    return null;
  }
  render(<Probe />);
  return seen;
}

describe('use-mobile', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('useIsMobileResolved', () => {
    it('is undefined on the first render, then true on a phone', async () => {
      setup(400);
      const seen = capture(useIsMobileResolved);
      await act(async () => {});
      expect(seen[0]).toBeUndefined();
      expect(seen.at(-1)).toBe(true);
    });

    it('is undefined on the first render, then false on desktop', async () => {
      setup(1280);
      const seen = capture(useIsMobileResolved);
      await act(async () => {});
      expect(seen[0]).toBeUndefined();
      expect(seen.at(-1)).toBe(false);
    });
  });

  describe('useIsMobile', () => {
    it('returns false on the first render, then true on a phone', async () => {
      setup(400);
      const seen = capture(useIsMobile);
      await act(async () => {});
      expect(seen[0]).toBe(false);
      expect(seen.at(-1)).toBe(true);
    });
  });
});
