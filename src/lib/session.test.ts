import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, SESSION_DURATION_MS, REFRESH_THRESHOLD_MS } from './session';
import { cookies } from 'next/headers';

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
    expect(REFRESH_THRESHOLD_MS).toBe(60 * 60 * 1000);
  });

  it('should create a session with 7 days expiration', async () => {
    const mockCookieStore = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

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
      })
    );

    vi.useRealTimers();
  });

  it('should create a session with a custom expiration date', async () => {
    const mockCookieStore = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const token = 'test-token';
    const customExpiresAt = new Date(Date.now() + 1000);

    await createSession(token, customExpiresAt);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'session',
      token,
      expect.objectContaining({
        expires: customExpiresAt,
      })
    );
  });
});
