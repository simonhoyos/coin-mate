import { set } from 'date-fns';
import { omitBy } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert.js';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import { resolvers } from './index';

describe('graphql/category', () => {
  describe('category authorization', () => {
    const destroyers: (() => Promise<unknown>)[] = [];
    let context: ITestContext;

    beforeAll(async () => {
      context = await createTestContext();
      destroyers.push(context.cleanup);
    });

    afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

    it('user logged in can see owned categories properties', async () => {
      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      const space = assertNotNull(
        await createSpace(context.services.knex, {
          user_id: user.id,
        }),
      );

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
          name: 'test category',
          description: 'some description',
        }),
      );

      const otherUser = assertNotNull(await createUser(context.services.knex));

      assertNotNull(
        await createCategory(context.services.knex, {
          user_id: otherUser.id,
          space_id: space.id,
          name: 'other category',
        }),
      );

      const categoriesQueryData = await resolvers.Query.categoryList(
        null as never,
        null as never,
        contextWithUser,
      );

      expect(categoriesQueryData.edges).toHaveLength(1);

      const name = await resolvers.Category.name(
        { id: category.id },
        null as never,
        contextWithUser,
      );

      expect(name).toBe(category.name);

      const description = await resolvers.Category.description(
        { id: category.id },
        null as never,
        contextWithUser,
      );

      expect(description).toBe(category.description);
    });

    it('user logged in can not see non-owned categories properties', async () => {
      const user = assertNotNull(await createUser(context.services.knex));
      const otherUser = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      const space = assertNotNull(
        await createSpace(context.services.knex, {
          user_id: otherUser.id,
        }),
      );

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: otherUser.id,
          space_id: space.id,
          name: 'other category',
        }),
      );

      const categoriesQueryData = await resolvers.Query.categoryList(
        null as never,
        null as never,
        contextWithUser,
      );

      expect(categoriesQueryData.edges).toHaveLength(0);

      const name = await resolvers.Category.name(
        { id: category.id },
        null as never,
        contextWithUser,
      );

      expect(name).toBeUndefined();

      const description = await resolvers.Category.description(
        { id: category.id },
        null as never,
        contextWithUser,
      );

      expect(description).toBeUndefined();
    });

    it('user not logged in cannot see any categories properties', async () => {
      const owner = assertNotNull(await createUser(context.services.knex));
      const space = assertNotNull(
        await createSpace(context.services.knex, {
          user_id: owner.id,
        }),
      );

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: owner.id,
          space_id: space.id,
          name: 'owner category',
        }),
      );

      expect(
        resolvers.Query.categoryList(
          null as never,
          null as never,
          context,
        )
      ).rejects.toThrow('Unauthorized')

      const name = await resolvers.Category.name(
        { id: category.id },
        null as never,
        context,
      );

      expect(name).toBeUndefined();

      const description = await resolvers.Category.description(
        { id: category.id },
        null as never,
        context,
      );

      expect(description).toBeUndefined();
    });
  });

  describe('category report', () => {
    const destroyers: (() => Promise<unknown>)[] = [];
    let context: ITestContext;

    beforeAll(async () => {
      context = await createTestContext();
      destroyers.push(context.cleanup);
    });

    afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

    it('filters report by month and year', async () => {
      const user = await createUser(context.services.knex);
      const contextWithUser = context.login(user);

      const space = await createSpace(
        context.services.knex,
        omitBy({ user_id: user?.id }, (v) => v == null),
      );

      const category = await createCategory(
        context.services.knex,
        omitBy({ user_id: user?.id, space_id: space?.id }, (v) => v == null),
      );

      const targetMonth = 1; // January
      const targetYear = 2026;

      const transactionCreationData = [
        {
          user_id: user?.id,
          category_id: category?.id,
          space_id: space?.id,
          amount_cents: 1000,
          transacted_at: set(new Date(), {
            year: 2026,
            month: 0,
            date: 15,
          }).toISOString(), // Jan 15, 2026
          type: 'expense',
        },
        {
          user_id: user?.id,
          category_id: category?.id,
          space_id: space?.id,
          amount_cents: 2000,
          transacted_at: set(new Date(), {
            year: 2026,
            month: 0,
            date: 20,
          }).toISOString(), // Jan 20, 2026
          type: 'expense',
        },
        {
          user_id: user?.id,
          category_id: category?.id,
          space_id: space?.id,
          amount_cents: 5000,
          transacted_at: set(new Date(), {
            year: 2026,
            month: 1,
            date: 15,
          }).toISOString(), // Feb 15, 2026
          type: 'expense',
        },
      ];

      await Promise.all(
        transactionCreationData.map((data) =>
          createTransactionLedger(
            context.services.knex,
            omitBy(data, (v) => v == null),
          ),
        ),
      );

      const result = await resolvers.Category.report(
        { id: category?.id ?? '' },
        { month: targetMonth, year: targetYear },
        contextWithUser,
      );

      expect(result).not.toBeNull();
      expect(result?.totalCount).toBe(2);
      expect(result?.totalAmountCents).toBe(3000);
      expect(result?.averageAmountCents).toBe(1500);

      const resultFeb = await resolvers.Category.report(
        { id: category?.id ?? '' },
        { month: 2, year: 2026 },
        contextWithUser,
      );

      expect(resultFeb).not.toBeNull();
      expect(resultFeb?.totalCount).toBe(1);
      expect(resultFeb?.totalAmountCents).toBe(5000);
    });
  });
});
