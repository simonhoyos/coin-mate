import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSession,
  REFRESH_THRESHOLD_MS,
  SESSION_DURATION_MS,
  shouldRefreshSession,
} from './session';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct constants', () => {
    expect(SESSION_DURATION_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(REFRESH_THRESHOLD_MS).toBe(1 * 24 * 60 * 60 * 1000);
  });

  it('should create a session with 7 days expiration', async () => {
    const mockCookieStore = {
      set: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore as unknown as ReadonlyRequestCookies,
    );

    const token = 'test-token';
    const now = Date.now();
    vi.setSystemTime(now);

    await createSession(token);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'session',
      token,
      expect.objectContaining({
        expires: new Date(now + SESSION_DURATION_MS),
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: false, // process.env.NODE_ENV is 'test' in vitest, usually treated as non-production
      }),
    );

    vi.useRealTimers();
  });

  it('should create a session with a custom expiration date', async () => {
    const mockCookieStore = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore as unknown as ReadonlyRequestCookies,
    );

    const token = 'test-token';
    const customExpiresAt = new Date(Date.now() + 1000);

    await createSession(token, customExpiresAt);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'session',
      token,
      expect.objectContaining({
        expires: customExpiresAt,
      }),
    );
  });

  describe('shouldRefreshSession', () => {
    it('should return true if session is older than threshold', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const issuedAtSeconds = Math.floor(
        (now - REFRESH_THRESHOLD_MS - 1000) / 1000,
      );
      expect(shouldRefreshSession(issuedAtSeconds)).toBe(true);

      vi.useRealTimers();
    });

    it('should return false if session is newer than threshold', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const issuedAtSeconds = Math.floor(
        (now - REFRESH_THRESHOLD_MS + 1000) / 1000,
      );
      expect(shouldRefreshSession(issuedAtSeconds)).toBe(false);

      vi.useRealTimers();
    });
  });
});
