import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createUser } from '@/lib/testing/factories/user';
import { resolvers } from '.';

describe('Category GraphQL type extension (integration)', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  async function setup() {
    const user = await createUser(context.services.knex);
    const space = assertNotNull(
      await createSpace(context.services.knex, { user_id: user.id }),
    );

    return { user, space };
  }

  it('creates a category with icon and color and exposes them', async () => {
    const { user, space } = await setup();

    const created = await resolvers.Mutation.categoryCreate(
      null as never,
      {
        input: {
          name: 'Coffee',
          space_id: space.id,
          icon: 'coffee',
          color: '#ef4444',
        },
      },
      context.login(user),
    );

    const id = assertNotNull(created.id);
    const readContext = context.login(user);

    expect(
      await resolvers.Category.icon({ id }, null as never, readContext),
    ).toBe('coffee');
    expect(
      await resolvers.Category.color({ id }, null as never, readContext),
    ).toBe('#ef4444');
  });

  it('updates icon and color and exposes the new values', async () => {
    const { user, space } = await setup();

    const category = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
      }),
    );

    await resolvers.Mutation.categoryUpdate(
      null as never,
      {
        input: {
          id: category.id,
          name: 'Renamed',
          icon: 'car',
          color: '#3b82f6',
        },
      },
      context.login(user),
    );

    const readContext = context.login(user);

    expect(
      await resolvers.Category.icon(
        { id: category.id },
        null as never,
        readContext,
      ),
    ).toBe('car');
    expect(
      await resolvers.Category.color(
        { id: category.id },
        null as never,
        readContext,
      ),
    ).toBe('#3b82f6');
  });

  it('returns null icon and color for a category without appearance', async () => {
    const { user, space } = await setup();

    const category = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
      }),
    );

    const readContext = context.login(user);

    expect(
      await resolvers.Category.icon(
        { id: category.id },
        null as never,
        readContext,
      ),
    ).toBeNull();
    expect(
      await resolvers.Category.color(
        { id: category.id },
        null as never,
        readContext,
      ),
    ).toBeNull();
  });
});
