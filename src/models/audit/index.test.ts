import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createUser } from '@/lib/testing/factories/user';
import { Audit } from './index';

describe('models/audit', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  describe('log', () => {
    it('logs a new audit successfully', async () => {
      const user = await createUser(context.services.knex);
      const contextWithUser = context.login(user);
      const objectId = crypto.randomUUID();

      const _audit = assertNotNull(
        await context.services.knex.transaction(async (trx) => {
          return Audit.log({
            trx,
            context: contextWithUser,
            data: {
              object: 'user',
              object_id: objectId,
              operation: 'create',
              payload: { name: 'test' },
            },
          });
        }),
      );

      const audit = assertNotNull(
        await context.services
          .knex<Audit>('audit')
          .where({ id: _audit.id })
          .limit(1)
          .first(),
      );

      expect(audit).toBeDefined();
      expect(audit.object).toBe('user');
      expect(audit.object_id).toBe(objectId);
      expect(audit.operation).toBe('create');
      expect(audit.user_id).toBe(user?.id);
      expect(audit.data.payload).toEqual({ name: 'test' });
    });

    it('fails to log if unsupported operation', async () => {
      await expect(
        context.services.knex.transaction(async (trx) => {
          return Audit.log({
            trx,
            context,
            data: {
              object: 'user',
              object_id: crypto.randomUUID(),
              // @ts-expect-error not assignable to operation
              operation: 'unsupported',
              payload: {},
            },
          });
        }),
      ).rejects.toThrow(ZodError);
    });

    it('fails to log if unsupported object', async () => {
      await expect(
        context.services.knex.transaction(async (trx) => {
          return Audit.log({
            trx,
            context,
            data: {
              // @ts-expect-error not assignable to object
              object: 'unsupported',
              object_id: crypto.randomUUID(),
              operation: 'create',
              payload: {},
            },
          });
        }),
      ).rejects.toThrow(ZodError);
    });
  });
});
