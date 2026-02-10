import { format } from 'date-fns';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { assertNotNull } from '@/lib/assert';
import * as CurrencyLib from '@/lib/currency';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createUser } from '@/lib/testing/factories/user';
import type { TransactionLedger } from '@/models/transaction-ledger';
import { resolvers } from '.';

describe('TransactionLedger.create', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should convert USD to COP when creating a transaction', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const contextWithUser = context.login(user);

    const space = await createSpace(context.services.knex, {
      user_id: user.id,
    });

    const category = await createCategory(context.services.knex, {
      space_id: assertNotNull(space?.id),
    });

    vi.spyOn(CurrencyLib, 'fetchExchangeRate').mockResolvedValue(4000.0);

    const transactionCreateResult =
      await resolvers.Mutation.transactionLedgerCreate(
        null as never,
        {
          input: {
            concept: 'Test USD Transaction',
            description: 'Buying something in USD',
            currency: 'USD',
            amount: '1050.00',
            transacted_at: format(new Date(), 'yyyy-MM-dd'),
            type: 'expense',
            category_id: assertNotNull(category?.id),
          },
        },
        contextWithUser,
      );

    const transactionLedger = await contextWithUser.services
      .knex<TransactionLedger>('transaction_ledger')
      .where({ id: assertNotNull(transactionCreateResult?.id) })
      .limit(1)
      .first();

    expect(transactionLedger?.original_currency).toBe('USD');
    expect(Number(transactionLedger?.original_amount_cents)).toBe(1_050_00);

    expect(transactionLedger?.currency).toBe('COP');
    expect(Number(transactionLedger?.amount_cents)).toBe(4_200_000_00);
  });
});
