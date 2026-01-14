import knex from 'knex';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert.js';
import { createTestContext } from '@/lib/testing/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import type { IContextInner } from '@/lib/types.js';
import type { User } from '@/models/user.js';
import knexConfig from '../../../../../knexfile.js';
import { resolvers } from './index';

const testKnex = knex(knexConfig);

describe('transactionLedgerList pagination (integration)', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: IContextInner;
  let user: User | undefined;

  beforeAll(async () => {
    user = await createUser(testKnex);

    context = await createTestContext();
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('returns the requested limit of transactions', async () => {
    const space = await createSpace(testKnex, { user_id: user.id });

    const category = await createCategory(testKnex, {
      ...(user?.id != null ? { user_id: user.id } : {}),
      ...(space?.id != null ? { space_id: space.id } : {}),
    });

    await Promise.all(
      [...Array(12)].map((_, i) =>
        createTransactionLedger(testKnex, {
          ...(user?.id != null ? { user_id: user.id } : {}),
          ...(category?.id != null ? { category_id: category.id } : {}),
          ...(space?.id != null ? { space_id: space.id } : {}),
          transacted_at: new Date(2026, 0, 11, 12, 0, 0 - i).toISOString(),
        }),
      ),
    );

    const result = await resolvers.Query.transactionLedgerList(
      null,
      { limit: 10 },
      context,
    );

    expect(result.edges.length).toBe(10);
    expect(result.cursor).not.toBeNull();
  });

  it('paginates correctly using cursor', async () => {
    const ITEMS_PER_PAGE = 4;

    const space = await createSpace(testKnex, {
      ...(user?.id != null ? { user_id: user.id } : {}),
    });

    const category = await createCategory(testKnex, {
      ...(user?.id != null ? { user_id: user.id } : {}),
      ...(space?.id != null ? { space_id: space.id } : {}),
    });

    await Promise.all(
      [...Array(10)].map((_, i) =>
        createTransactionLedger(testKnex, {
          user_id: user.id,
          ...(category?.id != null ? { category_id: category.id } : {}),
          ...(space?.id != null ? { space_id: space.id } : {}),
          transacted_at: new Date(2026, 0, 11, 12, 0, 0 - i).toISOString(),
        }),
      ),
    );

    const firstPage = await resolvers.Query.transactionLedgerList(
      null,
      { limit: ITEMS_PER_PAGE },
      context,
    );
    expect(firstPage.edges.length).toBe(ITEMS_PER_PAGE);
    expect(firstPage.cursor).not.toBeNull();

    const secondPage = await resolvers.Query.transactionLedgerList(
      null,
      { limit: 4, cursor: assertNotNull(firstPage.cursor) },
      context,
    );
    expect(secondPage.edges.length).toBe(ITEMS_PER_PAGE);
    expect(secondPage.cursor).not.toBeNull();

    const firstPageIds = firstPage.edges.map((e) => e.id);
    const secondPageIds = secondPage.edges.map((e) => e.id);

    expect(
      secondPageIds.every((id) => firstPageIds.includes(id) !== true),
    ).toBe(true);

    const thirdPage = await resolvers.Query.transactionLedgerList(
      null,
      { limit: ITEMS_PER_PAGE, cursor: assertNotNull(secondPage.cursor) },
      context,
    );

    expect(thirdPage.edges.length).toBe(2);
    expect(thirdPage.cursor).toBeNull();
  });

  it('handles empty results correctly', async () => {
    const newUser = await createUser(testKnex);
    const newContext = { ...context, user: newUser };

    const result = await resolvers.Query.transactionLedgerList(
      null,
      { limit: 10 },
      newContext,
    );

    expect(result.edges.length).toBe(0);
    expect(result.cursor).toBeNull();
  });
});
