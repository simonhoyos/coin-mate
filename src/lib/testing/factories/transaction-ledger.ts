import type { Knex } from 'knex';
import { assertNotNull } from '@/lib/assert';
import type { TransactionLedger } from '@/models/transaction-ledger';
import { createCategory } from './category';
import { createSpace } from './space';
import { createUser } from './user';

export async function createTransactionLedger(
  knex: Knex,
  overrides: Partial<TransactionLedger> = {},
): Promise<TransactionLedger | undefined> {
  const payload = {
    concept: `Transaction-${Date.now}`,
    description: 'Test transaction description',
    currency: 'COP',
    original_currency: 'COP',
    amount_cents: 100000,
    original_amount_cents: 100000,
    transacted_at: new Date().toISOString(),
    type: 'expense',
    user_id: assertNotNull(
      overrides.user_id ?? (await createUser(knex))?.id,
      'createTransactionLedger: user must be defined',
    ),
    category_id: assertNotNull(
      overrides.category_id ?? (await createCategory(knex))?.id,
      'createTransactionLedger: category must be defined',
    ),
    space_id: assertNotNull(
      overrides.space_id ?? (await createSpace(knex))?.id,
      'createTransactionLedger: space must be defined',
    ),
    ...overrides,
  };

  const [transaction] = await knex<TransactionLedger>(
    'transaction_ledger',
  ).insert(payload, '*');

  return transaction;
}
