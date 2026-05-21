import type { Knex } from 'knex';
import { assertNotNull } from '@/lib/assert';
import type { Space } from '@/models/space';
import { createUser } from './user';

export async function createSpace(
  knex: Knex,
  overrides: Partial<Space> = {},
): Promise<Space | undefined> {
  const payload = {
    name: `Space-${Date.now()}`,
    user_id: assertNotNull(
      overrides.user_id ?? (await createUser(knex))?.id,
      'createSpace: user must be defined',
    ),
    ...overrides,
  };

  const [space] = await knex<Space>('space').insert(payload, '*');

  if (space != null) {
    await knex('space_user').insert({
      space_id: space.id,
      user_id: space.user_id,
      role: 'admin',
    });
  }

  return space;
}
