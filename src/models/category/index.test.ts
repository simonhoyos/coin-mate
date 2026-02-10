import { getMonth, getYear, set, subMonths } from 'date-fns';
import { omit, omitBy } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import type { Audit } from '../audit';
import { Category } from './index';

describe('models/category', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it.each([
    { name: '', reason: 'name too short' },
    { name: 'a'.repeat(33), reason: 'name too long' },
    { name: undefined, reason: 'no name' },
    {
      name: 'valid name',
      description: 'a'.repeat(257),
      reason: 'description too long',
    },
  ])(
    'fails to create/update category with validation error: ($reason)',
    async ({ name, description }) => {
      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      await expect(
        Category.create({
          context: contextWithUser,
          data: {
            // @ts-expect-error undefined is not assignable to name
            name,
            description,
          },
        }),
      ).rejects.toThrow(ZodError);

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

      await expect(
        Category.update({
          context: contextWithUser,
          data: {
            id: category.id,
            name,
            description,
          },
        }),
      ).rejects.toThrow(ZodError);
    },
  );

  it('Authenticated user is authorized to create/read/update/delete an owned category', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    assertNotNull(
      await createSpace(context.services.knex, {
        user_id: user.id,
      }),
    );

    const contextWithUser = context.login(user);

    const createdCategory = assertNotNull(
      (
        await Category.create({
          context: contextWithUser,
          data: {
            name: 'a'.repeat(32),
            description: 'a'.repeat(254),
          },
        })
      ).category,
    );

    const createdAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: createdCategory.id,
        user_id: user.id,
        object: 'category',
        operation: 'create',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(createdAuditLog?.id != null).toBeTruthy();
    expect(createdAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(createdCategory, [
          'created_at',
          'updated_at',
          'archived_at',
          'id',
        ]),
      }),
    );

    const category = assertNotNull(
      await Category.gen({
        context: contextWithUser,
        id: createdCategory.id,
      }),
    );

    expect(category?.id).toBe(createdCategory.id);

    const updatedCategory = assertNotNull(
      (
        await Category.update({
          context: contextWithUser,
          data: {
            id: createdCategory.id,
            name: 'b'.repeat(32),
            description: 'b'.repeat(254),
          },
        })
      ).category,
    );

    const updatedAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: updatedCategory.id,
        user_id: user.id,
        object: 'category',
        operation: 'update',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(updatedAuditLog?.id != null).toBeTruthy();
    expect(updatedAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(updatedCategory, [
          'created_at',
          'updated_at',
          'archived_at',
          'id',
          'user_id',
          'space_id',
        ]),
      }),
    );

    const deletedCategory = assertNotNull(
      (
        await Category.delete({
          context: contextWithUser,
          data: {
            id: updatedCategory.id,
          },
        })
      ).category,
    );

    const deletedAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: deletedCategory.id,
        user_id: user.id,
        object: 'category',
        operation: 'delete',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(deletedAuditLog?.id != null).toBeTruthy();
    expect(deletedAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        archived_at: new Date(
          assertNotNull(deletedCategory.archived_at),
        ).toISOString(),
      }),
    );
  });

  it('Authenticated user is not authorized to read/update/delete not owned categories', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const otherUser = assertNotNull(await createUser(context.services.knex));

    const otherSpace = assertNotNull(
      await createSpace(context.services.knex, {
        user_id: otherUser.id,
      }),
    );

    const otherCategory = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: otherUser.id,
        space_id: otherSpace.id,
      }),
    );

    const contextWithUser = context.login(user);

    const category = await Category.gen({
      context: contextWithUser,
      id: otherCategory.id,
    });

    expect(category == null).toBeTruthy();

    await expect(
      Category.update({
        context: contextWithUser,
        data: {
          id: otherCategory.id,
          name: 'b'.repeat(32),
          description: 'b'.repeat(254),
        },
      }),
    ).rejects.toThrow('Category not found');

    await expect(
      Category.delete({
        context: contextWithUser,
        data: {
          id: otherCategory.id,
        },
      }),
    ).rejects.toThrow('Category not found');
  });

  it('Unauthenticated user is not authorized to create/read/update/delete categories', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

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

    expect(
      (await Category.gen({
        context,
        id: category.id,
      })) == null,
    ).toBeTruthy();

    await expect(
      Category.create({
        context,
        data: {
          name: 'a'.repeat(32),
          description: 'a'.repeat(254),
        },
      }),
    ).rejects.toThrow('User must be authenticated to create a category');

    await expect(
      Category.update({
        context,
        data: {
          id: category.id,
          name: 'b'.repeat(32),
          description: 'b'.repeat(254),
        },
      }),
    ).rejects.toThrow('User must be authenticated to update a category');

    await expect(
      Category.delete({
        context,
        data: {
          id: category.id,
        },
      }),
    ).rejects.toThrow('User must be authenticated to delete a category');
  });

  it('filters report by month and year', async () => {
    const user = assertNotNull(await createUser(context.services.knex));
    const contextWithUser = context.login(user);

    const space = assertNotNull(
      await createSpace(context.services.knex, {
        user_id: user.id,
      }),
    );

    const testCategory = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
      }),
    );

    const category = assertNotNull(
      await Category.gen({
        context: contextWithUser,
        id: testCategory.id,
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
      [
        ...transactionCreationDataCurrent,
        ...transactionCreationDataPrevious,
      ].map((data) =>
        createTransactionLedger(
          context.services.knex,
          omitBy(data, (v) => v == null),
        ),
      ),
    );

    const result = await category.getReport({
      month: targetMonth,
      year: targetYear,
    });

    const totalCountCurrent = transactionCreationDataCurrent.length;

    const totalSumCurrent = transactionCreationDataCurrent.reduce(
      (sum, transaction) => sum + (transaction.amount_cents ?? 0),
      0,
    );

    expect(result).not.toBeNull();
    expect(result?.totalCount).toBe(totalCountCurrent);
    expect(result?.totalAmountCents).toBe(totalSumCurrent);
    expect(result?.averageAmountCents).toBe(
      totalSumCurrent / totalCountCurrent,
    );

    const totalCountPrevious = transactionCreationDataPrevious.length;

    const totalSumPrevious = transactionCreationDataPrevious.reduce(
      (sum, transaction) => sum + (transaction.amount_cents ?? 0),
      0,
    );

    const resultPrevious = await category.getReport({
      month: targetMothPrevious,
      year: targetYearPrevious,
    });

    expect(resultPrevious).not.toBeNull();
    expect(resultPrevious?.totalCount).toBe(totalCountPrevious);
    expect(resultPrevious?.totalAmountCents).toBe(totalSumPrevious);
    expect(resultPrevious?.averageAmountCents).toBe(
      totalSumPrevious / totalCountPrevious,
    );
  });
});
