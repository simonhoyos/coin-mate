import { TransactionLedger } from '@/models/transaction-ledger';

export function createTransactionLedgerFactory(overrides: Partial<TransactionLedger> = {}): TransactionLedger {
  const id = crypto.randomUUID();
  return {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    concept: `Transaction ${id.slice(0, 4)}`,
    description: 'Test transaction description',
    currency: 'USD',
    amount_cents: 1000,
    transacted_at: new Date().toISOString(),
    type: 'expense',
    user_id: crypto.randomUUID(),
    category_id: crypto.randomUUID(),
    ...overrides,
  } as TransactionLedger;
}
