import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

const SESSION_COOKIE_NAME = 'session';

export async function createSession(token: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const cookieStore = await cookies();

  return cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    expires: expiresAt,
    sameSite: 'strict',
    path: '/',
  });
}

export async function getSession() {
  return (await cookies()).get(SESSION_COOKIE_NAME);
}

export async function clearSession() {
  return (await cookies()).delete(SESSION_COOKIE_NAME);
}
