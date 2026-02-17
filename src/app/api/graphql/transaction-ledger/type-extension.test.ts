import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import { resolvers } from '.';

describe('TransactionLedger GraphQL type extension (integration)', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('exposes original_amount_cents and original_currency', async () => {
    const user = await createUser(context.services.knex);
    const testContext = context.login(user);

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

    await createTransactionLedger(context.services.knex, {
      user_id: user.id,
      category_id: category.id,
      space_id: space.id,
      original_amount_cents: 10000,
      original_currency: 'USD',
      amount_cents: 400000,
      currency: 'COP',
    });

    const result = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: 1 },
      testContext,
    );

    const edges = result.edges;

    expect(edges.length).toBe(1);

    const transaction = assertNotNull(edges[0]);

    const amountCents = await resolvers.TransactionLedger.amount_cents(
      { id: transaction.id },
      null as never,
      testContext,
    );

    expect(typeof amountCents).toBe('number');

    const originalAmountCents =
      await resolvers.TransactionLedger.original_amount_cents(
        transaction,
        null as never,
        testContext,
      );

    const originalCurrency =
      await resolvers.TransactionLedger.original_currency(
        transaction,
        null as never,
        testContext,
      );

    expect(originalAmountCents).toBe(10000);
    expect(originalCurrency).toBe('USD');
  });
});
