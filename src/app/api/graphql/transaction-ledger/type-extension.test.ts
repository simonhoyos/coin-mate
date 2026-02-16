import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

    const space = await createSpace(context.services.knex, {
      user_id: user.id,
    });
    const category = await createCategory(context.services.knex, {
      user_id: user.id,
      space_id: space.id,
    });

    const transaction = await createTransactionLedger(context.services.knex, {
      user_id: user.id,
      category_id: category.id,
      space_id: space.id,
      original_amount_cents: 10000, // 100.00
      original_currency: 'USD',
      amount_cents: 400000, // Assuming 4000 rate for COP
      currency: 'COP',
    });

    const result = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: 1 },
      testContext,
    );

    const edges = result.edges;
    expect(edges.length).toBe(1);

    // We need to resolve the fields. Since we are testing the resolvers directly,
    // we need to call the resolvers for the specific fields on the returned object.

    const gqlTransaction = edges[0];

    const amountCents = await resolvers.TransactionLedger.amount_cents(
      gqlTransaction,
      {},
      testContext,
    );
    expect(typeof amountCents).toBe('number');

    // @ts-expect-error - These fields don't exist yet in the types
    const originalAmountCents =
      await resolvers.TransactionLedger.original_amount_cents(
        gqlTransaction,
        {},
        testContext,
      );
    // @ts-expect-error - These fields don't exist yet in the types
    const originalCurrency =
      await resolvers.TransactionLedger.original_currency(
        gqlTransaction,
        {},
        testContext,
      );

    expect(originalAmountCents).toBe(10000);
    expect(originalCurrency).toBe('USD');
  });
});
