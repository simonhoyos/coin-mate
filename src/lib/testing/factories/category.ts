import type { Knex } from 'knex';
import { assertNotNull } from '@/lib/assert';
import type { Category } from '@/models/category';
import { createSpace } from './space';
import { createUser } from './user';

export async function createCategory(
  knex: Knex,
  overrides: Partial<Category> = {},
): Promise<Category | undefined> {
  const payload = {
    name: `Category-${Date.now()}`,
    description: 'Test category description',
    user_id: assertNotNull(
      overrides.user_id ?? (await createUser(knex))?.id,
      'createCategory: user must be defined',
    ),
    space_id: assertNotNull(
      overrides.space_id ?? (await createSpace(knex))?.id,
      'createCategory: space must be defined',
    ),
    ...overrides,
  };

  const [category] = await knex<Category>('category').insert(payload, '*');

  return category;
}
