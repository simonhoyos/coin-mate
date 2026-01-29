import { omitBy } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import { resolvers } from './index';

describe('categoryReport (integration)', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('filters report by month and year', async () => {
    const user = await createUser(context.services.knex);
    const testContext = context.login(user);

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

    await Promise.all([
      createTransactionLedger(
        context.services.knex,
        omitBy(
          {
            user_id: user?.id,
            category_id: category?.id,
            space_id: space?.id,
            amount_cents: 1000,
            transacted_at: new Date(2026, 0, 15).toISOString(), // Jan 15, 2026
            type: 'expense',
          },
          (v) => v == null,
        ),
      ),
      createTransactionLedger(
        context.services.knex,
        omitBy(
          {
            user_id: user?.id,
            category_id: category?.id,
            space_id: space?.id,
            amount_cents: 2000,
            transacted_at: new Date(2026, 0, 20).toISOString(), // Jan 20, 2026
            type: 'expense',
          },
          (v) => v == null,
        ),
      ),
    ]);

    await createTransactionLedger(
      context.services.knex,
      omitBy(
        {
          user_id: user?.id,
          category_id: category?.id,
          space_id: space?.id,
          amount_cents: 5000,
          transacted_at: new Date(2026, 1, 15).toISOString(), // Feb 15, 2026
          type: 'expense',
        },
        (v) => v == null,
      ),
    );

    const result = await resolvers.Category.report(
      { id: category?.id ?? '' },
      { month: targetMonth, year: targetYear },
      testContext,
    );

    expect(result).not.toBeNull();
    expect(result?.totalCount).toBe(2);
    expect(result?.totalAmountCents).toBe(3000);
    expect(result?.averageAmountCents).toBe(1500);

    const resultFeb = await resolvers.Category.report(
      { id: category?.id ?? '' },
      { month: 2, year: 2026 },
      testContext,
    );

    expect(resultFeb).not.toBeNull();
    expect(resultFeb?.totalCount).toBe(1);
    expect(resultFeb?.totalAmountCents).toBe(5000);
  });
});
