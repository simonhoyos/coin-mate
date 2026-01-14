import type { Knex } from 'knex';
import { assertNotNull } from '@/lib/assert';
import type { Space } from '@/models/space';
import { createUser } from './user';

export async function createSpace(
  knex: Knex,
  overrides: Partial<Space> = {},
): Promise<Space | undefined> {
  const payload = {
    name: `Space-${Date.now}`,
    user_id: assertNotNull(
      overrides.user_id ?? (await createUser(knex))?.id,
      'createSpace: user must be defined',
    ),
    ...overrides,
  };

  const [space] = await knex<Space>('space').insert(payload, '*');

  return space;
}
