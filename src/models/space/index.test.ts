import { omit } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { createUser } from '@/lib/testing/factories/user';
import type { Audit } from '../audit';
import { Space, type SpaceUser } from '.';

describe('models/space', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('creates a space and a default space user as admin', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const trxResult = await context.services.knex.transaction(async (trx) => {
      const space = assertNotNull(
        (
          await Space.create({
            trx,
            context,
            data: {
              userId: user.id,
              name: 'My space',
              description: 'My space description',
            },
          })
        ).space,
      );

      return { space };
    });

    const createdAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: trxResult.space.id,
        object: 'space',
        operation: 'create',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(createdAuditLog?.id != null).toBeTruthy();
    expect(createdAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(trxResult.space, [
          'id',
          'created_at',
          'updated_at',
          'archived_at',
        ]),
      }),
    );

    const spaceUser = assertNotNull(
      await context.services
        .knex<SpaceUser>('space_user')
        .where({ user_id: user.id, space_id: trxResult.space.id })
        .limit(1)
        .first(),
    );

    const createdSpaceUserAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: spaceUser.id,
        object: 'space_user',
        operation: 'create',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(createdSpaceUserAuditLog?.id != null).toBeTruthy();
    expect(createdSpaceUserAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(spaceUser, ['id', 'created_at', 'updated_at', 'archived_at']),
      }),
    );

    expect(spaceUser.role).toBe('admin');
  });
});
