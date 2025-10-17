import 'server-only';
import { cookies } from 'next/headers';

const MS_IN_MONTH = 30 * 7 * 24 * 60 * 60 * 1000;

export async function createSession(token: string) {
  const expiresAt = new Date(Date.now() + MS_IN_MONTH);
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'strict',
    path: '/',
  });
}

export async function getSession() {
  return (await cookies()).get('session');
}
