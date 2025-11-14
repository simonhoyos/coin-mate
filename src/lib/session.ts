import 'server-only';
import { cookies } from 'next/headers';

const MS_IN_MONTH = 30 * 7 * 24 * 60 * 60 * 1000;

const SESSION_COOKIE_NAME = 'session';

export async function createSession(token: string) {
  const expiresAt = new Date(Date.now() + MS_IN_MONTH);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
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
