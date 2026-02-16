import { format } from 'date-fns';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import * as CurrencyLib from '@/lib/currency';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createUser } from '@/lib/testing/factories/user';
import type { Audit } from '../audit';
import { TransactionLedger } from '.';

describe('Transaction Ledger End-to-End Integration', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('completes the full cycle: Create USD -> Update USD -> Verify Audit', async () => {
    const user = assertNotNull(await createUser(context.services.knex));
    const contextWithUser = context.login(user);
    const space = await createSpace(context.services.knex, { user_id: user.id });
    const category = await createCategory(context.services.knex, {
      user_id: user.id,
      space_id: space.id,
    });

    // 1. Create USD Transaction (Initial Rate: 4000)
    vi.spyOn(CurrencyLib, 'fetchExchangeRate').mockResolvedValue(4000.0);

    const createResult = await TransactionLedger.create({
      context: contextWithUser,
      data: {
        concept: 'E2E USD Transaction',
        description: 'First USD entry',
        currency: 'USD',
        amount_cents: '100.00',
        transacted_at: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense',
        category_id: category.id,
      },
    });

    const createdTx = assertNotNull(createResult.transactionLedger);
    expect(Number(createdTx.amount_cents)).toBe(400_000_00);
    expect(Number(createdTx.original_amount_cents)).toBe(100_00);

    // Verify Create Audit
    const createAudit = await context.services.knex<Audit>('audit')
      .where({ object_id: createdTx.id, operation: 'create' })
      .first();
    
    expect(createAudit?.data.payload).toMatchObject({
      currency: 'COP',
      original_currency: 'USD',
      amount_cents: 400_000_00,
      original_amount_cents: 100_00,
    });

    // 2. Update USD Transaction (New Rate: 4200)
    vi.spyOn(CurrencyLib, 'fetchExchangeRate').mockResolvedValue(4200.0);

    const updateResult = await TransactionLedger.update({
      context: contextWithUser,
      data: {
        id: createdTx.id,
        concept: 'Updated E2E USD Transaction',
        description: 'Updated USD entry',
        currency: 'USD',
        amount_cents: '150.00',
        transacted_at: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense',
        category_id: category.id,
      },
    });

    const updatedTx = assertNotNull(updateResult.transaction);
    // 150 * 4200 = 630,000.00 COP cents
    expect(Number(updatedTx.amount_cents)).toBe(630_000_00);
    expect(Number(updatedTx.original_amount_cents)).toBe(150_00);

    // Verify Update Audit
    const updateAudit = await context.services.knex<Audit>('audit')
      .where({ object_id: createdTx.id, operation: 'update' })
      .orderBy('created_at', 'desc')
      .first();
    
    expect(updateAudit?.data.payload).toMatchObject({
      concept: 'Updated E2E USD Transaction',
      description: 'Updated USD entry',
      amount_cents: 630_000_00,
      original_amount_cents: 150_00,
    });
  });
});
