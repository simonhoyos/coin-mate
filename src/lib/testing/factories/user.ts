import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import type { User } from '@/models/user';

export async function createUser(
  knex: Knex,
  overrides: Partial<User> = {},
): Promise<User | undefined> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(
    overrides.password ?? 'Test-password123',
    salt,
  );

  const payload = {
    email: `user-${crypto.randomUUID()}@example.com`,
    ...overrides,
    password: hash,
  };

  const [user] = await knex<User>('user').insert(payload, '*');

  return user;
}
