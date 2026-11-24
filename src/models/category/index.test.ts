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
import { Category } from '.';

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
    { name: 'valid name', icon: 'not-an-icon', reason: 'unknown icon' },
    { name: 'valid name', color: '#123456', reason: 'non-palette color' },
    { name: 'valid name', color: 'red', reason: 'color is not hex' },
  ])(
    'fails to create category with validation error: ($reason)',
    async ({ name, description, icon, color }) => {
      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      await expect(
        Category.create({
          context: contextWithUser,
          data: {
            // @ts-expect-error undefined is not assignable to name
            name,
            description,
            icon,
            color,
          },
        }),
      ).rejects.toThrow(ZodError);
    },
  );

  it.each([
    { name: '', reason: 'name too short' },
    { name: 'a'.repeat(33), reason: 'name too long' },
    {
      name: 'valid name',
      description: 'a'.repeat(257),
      reason: 'description too long',
    },
    { name: 'valid name', icon: 'not-an-icon', reason: 'unknown icon' },
    { name: 'valid name', color: '#123456', reason: 'non-palette color' },
    { name: 'valid name', color: 'red', reason: 'color is not hex' },
  ])(
    'fails to update category with validation error: ($reason)',
    async ({ name, description, icon, color }) => {
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

      await expect(
        Category.update({
          context: contextWithUser,
          data: {
            id: category.id,
            name,
            description,
            icon,
            color,
          },
        }),
      ).rejects.toThrow(ZodError);
    },
  );

  it('Authenticated user is authorized to create/read/update/delete an owned category', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const space = assertNotNull(
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
            space_id: space.id,
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
          'icon',
          'color',
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
          space_id: space.id,
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

  describe('icon and color', () => {
    async function setup() {
      const user = assertNotNull(await createUser(context.services.knex));
      const space = assertNotNull(
        await createSpace(context.services.knex, { user_id: user.id }),
      );

      return { user, space, contextWithUser: context.login(user) };
    }

    it('creates a category with icon and color', async () => {
      const { user, space, contextWithUser } = await setup();

      const created = assertNotNull(
        (
          await Category.create({
            context: contextWithUser,
            data: {
              name: 'with appearance',
              space_id: space.id,
              icon: 'coffee',
              color: '#ef4444',
            },
          })
        ).category,
      );

      expect(created.icon).toBe('coffee');
      expect(created.color).toBe('#ef4444');

      const fetched = assertNotNull(
        await Category.gen({
          context: context.login(user),
          id: created.id,
        }),
      );

      expect(fetched.icon).toBe('coffee');
      expect(fetched.color).toBe('#ef4444');

      const auditLog = await context.services
        .knex<Audit>('audit')
        .where({
          object_id: created.id,
          object: 'category',
          operation: 'create',
        })
        .first();

      expect(auditLog?.data.payload).toMatchObject({
        icon: 'coffee',
        color: '#ef4444',
      });
    });

    it('stores null icon and color when omitted on create', async () => {
      const { user, space, contextWithUser } = await setup();

      const created = assertNotNull(
        (
          await Category.create({
            context: contextWithUser,
            data: { name: 'plain', space_id: space.id },
          })
        ).category,
      );

      expect(created.icon).toBeNull();
      expect(created.color).toBeNull();

      const fetched = assertNotNull(
        await Category.gen({ context: context.login(user), id: created.id }),
      );

      expect(fetched.icon).toBeNull();
      expect(fetched.color).toBeNull();
    });

    it('updates icon and color', async () => {
      const { user, space, contextWithUser } = await setup();

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
        }),
      );

      const updated = assertNotNull(
        (
          await Category.update({
            context: contextWithUser,
            data: {
              id: category.id,
              name: 'renamed',
              icon: 'car',
              color: '#3b82f6',
            },
          })
        ).category,
      );

      expect(updated.icon).toBe('car');
      expect(updated.color).toBe('#3b82f6');

      const fetched = assertNotNull(
        await Category.gen({ context: context.login(user), id: category.id }),
      );

      expect(fetched.icon).toBe('car');
      expect(fetched.color).toBe('#3b82f6');

      const auditLog = await context.services
        .knex<Audit>('audit')
        .where({
          object_id: category.id,
          object: 'category',
          operation: 'update',
        })
        .orderBy('created_at', 'desc')
        .first();

      expect(auditLog?.data.payload).toMatchObject({
        icon: 'car',
        color: '#3b82f6',
      });
    });

    it('leaves icon and color unchanged when only the name is sent', async () => {
      const { user, space, contextWithUser } = await setup();

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
          icon: 'home',
          color: '#22c55e',
        }),
      );

      await Category.update({
        context: contextWithUser,
        data: { id: category.id, name: 'only name' },
      });

      const fetched = assertNotNull(
        await Category.gen({ context: context.login(user), id: category.id }),
      );

      expect(fetched.name).toBe('only name');
      expect(fetched.icon).toBe('home');
      expect(fetched.color).toBe('#22c55e');
    });

    it('does not throw when an update changes nothing', async () => {
      const { user, space, contextWithUser } = await setup();

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
          name: 'same name',
          description: 'same description',
        }),
      );

      const result = await Category.update({
        context: contextWithUser,
        data: {
          id: category.id,
          name: 'same name',
          description: 'same description',
          icon: undefined,
          color: undefined,
        },
      });

      expect(result.category?.id).toBe(category.id);
    });

    it('clears icon and color when null is sent', async () => {
      const { user, space, contextWithUser } = await setup();

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
          icon: 'home',
          color: '#22c55e',
        }),
      );

      await Category.update({
        context: contextWithUser,
        data: {
          id: category.id,
          name: category.name,
          icon: null,
          color: null,
        },
      });

      const fetched = assertNotNull(
        await Category.gen({ context: context.login(user), id: category.id }),
      );

      expect(fetched.icon).toBeNull();
      expect(fetched.color).toBeNull();
    });
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
