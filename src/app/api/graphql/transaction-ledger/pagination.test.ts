import knex from 'knex';
import { omitBy } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert.js';
import { createTestContext, type ITestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import knexConfig from '../../../../../knexfile.js';
import { resolvers } from './index';

const testKnex = knex(knexConfig);

describe('transactionLedgerList pagination (integration)', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('returns the requested limit of transactions', async () => {
    const user = await createUser(testKnex);
    const testContext = context.login(user);

    const space = await createSpace(
      testKnex,
      omitBy(
        {
          user_id: user?.id,
        },
        (value) => value == null,
      ),
    );

    const category = await createCategory(
      testKnex,
      omitBy(
        {
          user_id: user?.id,
          space_id: space?.id,
        },
        (value) => value == null,
      ),
    );

    await Promise.all(
      [...Array(12)].map((_, i) =>
        createTransactionLedger(
          testKnex,
          omitBy(
            {
              user_id: user?.id,
              category_id: category?.id,
              space_id: space?.id,
              transacted_at: new Date(2026, 0, 11, 12, 0, 0 - i).toISOString(),
            },
            (value) => value == null,
          ),
        ),
      ),
    );

    const result = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: 10 },
      testContext,
    );

    expect(result.edges.length).toBe(10);
    expect(result.cursor).not.toBeNull();
  });

  it('paginates correctly using cursor', async () => {
    const ITEMS_PER_PAGE = 4;
    const user = await createUser(testKnex);
    const testContext = context.login(user);

    const space = await createSpace(
      testKnex,
      omitBy(
        {
          user_id: user?.id,
        },
        (value) => value == null,
      ),
    );

    const category = await createCategory(
      testKnex,
      omitBy(
        {
          user_id: user?.id,
          space_id: space?.id,
        },
        (value) => value == null,
      ),
    );

    await Promise.all(
      [...Array(10)].map((_, i) =>
        createTransactionLedger(
          testKnex,
          omitBy(
            {
              user_id: user?.id,
              category_id: category?.id,
              space_id: space?.id,
              transacted_at: new Date(2026, 0, 11, 12, 0, 0 - i).toISOString(),
            },
            (value) => value == null,
          ),
        ),
      ),
    );

    const firstPage = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: ITEMS_PER_PAGE },
      testContext,
    );

    expect(firstPage.edges.length).toBe(ITEMS_PER_PAGE);
    expect(firstPage.cursor).not.toBeNull();

    const secondPage = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: ITEMS_PER_PAGE, cursor: assertNotNull(firstPage.cursor) },
      testContext,
    );

    expect(secondPage.edges.length).toBe(ITEMS_PER_PAGE);
    expect(secondPage.cursor).not.toBeNull();

    const firstPageIds = firstPage.edges.map((e) => e.id);
    const secondPageIds = secondPage.edges.map((e) => e.id);

    expect(
      secondPageIds.every((id) => firstPageIds.includes(id) !== true),
    ).toBe(true);

    const thirdPage = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: ITEMS_PER_PAGE, cursor: assertNotNull(secondPage.cursor) },
      testContext,
    );

    expect(thirdPage.edges.length).toBe(2);
    expect(thirdPage.cursor).toBeNull();
  });

  it('handles empty results correctly', async () => {
    const user = await createUser(testKnex);
    const testContext = context.login(user);

    const result = await resolvers.Query.transactionLedgerList(
      null as never,
      { limit: 10 },
      testContext,
    );

    expect(result.edges.length).toBe(0);
    expect(result.cursor).toBeNull();
  });
});
