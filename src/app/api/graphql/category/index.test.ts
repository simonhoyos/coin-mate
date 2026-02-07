import { getMonth, getYear, set, subMonths } from 'date-fns';
import { omitBy } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert.js';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import { resolvers } from './index';

async function setup(context: ITestContext) {
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
    }),
  );

  const randomPastDate = subMonths(
    new Date(),
    Math.floor(Math.random() * 12) + 1,
  );
  const targetMonth = getMonth(randomPastDate);
  const targetYear = getYear(randomPastDate);

  const previousDate = subMonths(randomPastDate, 1);

  const targetMothPrevious = getMonth(previousDate);
  const targetYearPrevious = getYear(previousDate);

  const transactionCreationDataCurrent = [
    ...Array(Math.ceil(Math.random() * 3)),
  ].map(() => ({
    user_id: user.id,
    category_id: category.id,
    space_id: space.id,
    amount_cents: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
    transacted_at: set(randomPastDate, {
      date: Math.floor(Math.random() * 27),
    }).toISOString(),
    type: 'expense',
  }));

  const transactionCreationDataPrevious = [
    ...Array(Math.ceil(Math.random() * 3)),
  ].map(() => ({
    user_id: user.id,
    category_id: category.id,
    space_id: space.id,
    amount_cents: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
    transacted_at: set(previousDate, {
      date: Math.floor(Math.random() * 27),
    }).toISOString(),
    type: 'expense',
  }));

  await Promise.all(
    [...transactionCreationDataCurrent, ...transactionCreationDataPrevious].map(
      (data) =>
        createTransactionLedger(
          context.services.knex,
          omitBy(data, (v) => v == null),
        ),
    ),
  );

  return {
    contextWithUser,
    category,
    targetYear,
    targetMonth,
    targetYearPrevious,
    targetMothPrevious,
    totalCountCurrent: transactionCreationDataCurrent.length,
    totalSumCurrent: transactionCreationDataCurrent.reduce(
      (sum, transaction) => sum + (transaction.amount_cents ?? 0),
      0,
    ),
    totalCountPrevious: transactionCreationDataPrevious.length,
    totalSumPrevious: transactionCreationDataPrevious.reduce(
      (sum, transaction) => sum + (transaction.amount_cents ?? 0),
      0,
    ),
  };
}

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
      const { contextWithUser, category, targetYear, targetMonth } =
        await setup(context);

      const otherUser = assertNotNull(await createUser(context.services.knex));

      const space = assertNotNull(
        await createSpace(context.services.knex, {
          user_id: otherUser.id,
        }),
      );

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

      const report = await resolvers.Category.report(
        { id: category.id },
        { year: targetYear, month: targetMonth },
        contextWithUser,
      );

      expect(report == null).toBeFalsy();
    });

    it('user logged in can not see non-owned categories properties', async () => {
      const { category, targetYear, targetMonth } = await setup(context);

      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

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

      expect(name == null).toBeTruthy();

      const description = await resolvers.Category.description(
        { id: category.id },
        null as never,
        contextWithUser,
      );

      expect(description == null).toBeTruthy();

      const report = await resolvers.Category.report(
        { id: category.id },
        { year: targetYear, month: targetMonth },
        contextWithUser,
      );

      expect(report == null).toBeTruthy();
    });

    it('user not logged in cannot see any categories properties', async () => {
      const { category, targetYear, targetMonth } = await setup(context);

      await expect(
        resolvers.Query.categoryList(null as never, null as never, context),
      ).rejects.toThrow('Unauthorized');

      const name = await resolvers.Category.name(
        { id: category.id },
        null as never,
        context,
      );

      expect(name == null).toBeTruthy();

      const description = await resolvers.Category.description(
        { id: category.id },
        null as never,
        context,
      );

      expect(description == null).toBeTruthy();

      const report = await resolvers.Category.report(
        { id: category.id },
        { year: targetYear, month: targetMonth },
        context,
      );

      expect(report == null).toBeTruthy();
    });

    it('user logged in can create, update, and delete owned categories', async () => {
      const { contextWithUser, category } = await setup(context);

      const newCategory = await resolvers.Mutation.categoryCreate(
        null as never,
        { input: { name: 'new category', description: 'new description' } },
        contextWithUser,
      );

      expect(newCategory.id != null).toBeTruthy();

      const updatedCategory = await resolvers.Mutation.categoryUpdate(
        null as never,
        {
          input: {
            id: category.id,
            name: 'updated category',
          },
        },
        contextWithUser,
      );

      expect(updatedCategory.id).toBe(category.id);

      const deletedCategory = await resolvers.Mutation.categoryDelete(
        null as never,
        { input: { id: category.id } },
        contextWithUser,
      );

      expect(deletedCategory.id).toBe(category.id);
    });

    it('user logged cannot update, or delete non-owned categories', async () => {
      const { category } = await setup(context);

      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      await expect(
        resolvers.Mutation.categoryUpdate(
          null as never,
          { input: { id: category.id, name: 'unauthorized' } },
          contextWithUser,
        ),
      ).rejects.toThrow('Category not found');

      await expect(
        resolvers.Mutation.categoryDelete(
          null as never,
          { input: { id: category.id } },
          contextWithUser,
        ),
      ).rejects.toThrow('Category not found');
    });

    it('user not logged in cannot create, update or delete categories', async () => {
      const { category } = await setup(context);

      await expect(
        resolvers.Mutation.categoryCreate(
          null as never,
          { input: { name: 'unauthorized' } },
          context,
        ),
      ).rejects.toThrow('User must be authenticated to create a category');

      await expect(
        resolvers.Mutation.categoryUpdate(
          null as never,
          { input: { id: category.id, name: 'unauthorized' } },
          context,
        ),
      ).rejects.toThrow('User must be authenticated to update a category');

      await expect(
        resolvers.Mutation.categoryDelete(
          null as never,
          { input: { id: category.id } },
          context,
        ),
      ).rejects.toThrow('User must be authenticated to delete a category');
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
      const setupResult = await setup(context);

      const result = await resolvers.Category.report(
        { id: setupResult.category.id },
        { month: setupResult.targetMonth, year: setupResult.targetYear },
        setupResult.contextWithUser,
      );

      expect(result).not.toBeNull();
      expect(result?.totalCount).toBe(setupResult.totalCountCurrent);
      expect(result?.totalAmountCents).toBe(setupResult.totalSumCurrent);
      expect(result?.averageAmountCents).toBe(
        setupResult.totalSumCurrent / setupResult.totalCountCurrent,
      );

      const resultPrevious = await resolvers.Category.report(
        { id: setupResult.category.id },
        {
          month: setupResult.targetMothPrevious,
          year: setupResult.targetYearPrevious,
        },
        setupResult.contextWithUser,
      );

      expect(resultPrevious).not.toBeNull();
      expect(resultPrevious?.totalCount).toBe(setupResult.totalCountPrevious);
      expect(resultPrevious?.totalAmountCents).toBe(
        setupResult.totalSumPrevious,
      );
      expect(resultPrevious?.averageAmountCents).toBe(
        setupResult.totalSumPrevious / setupResult.totalCountPrevious,
      );
    });
  });
});
