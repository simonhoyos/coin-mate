import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { assertNotNull } from '@/lib/assert';
import type { User } from '@/models/user';

export async function createUser(
  knex: Knex,
  overrides: Partial<User> = {},
): Promise<User & { originalPassword: string }> {
  const originalPassword = overrides.password ?? 'Test-password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(originalPassword, salt);

  const payload = {
    email: `user-${crypto.randomUUID()}@example.com`,
    ...overrides,
    password: hash,
  };

  const user = assertNotNull(
    (await knex<User>('user').insert(payload, '*')).at(0),
    'factory/createUser: user could not be created',
  );

  return {
    ...user,
    originalPassword,
  };
}
