import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvers } from './index';
import { createTransactionLedgerFactory } from '@/lib/testing/factories/transaction-ledger';

vi.mock('@/models/transaction-ledger', () => ({
  TypeEnum: {
    parse: vi.fn((v) => v),
  },
  TransactionLedger: {
    gen: vi.fn().mockImplementation((args) => Promise.resolve({ id: args.id })),
  },
}));

describe('transactionLedgerList pagination', () => {
  let mockKnex: any;
  let context: any;

  beforeEach(() => {
    const mockTransaction = createTransactionLedgerFactory({ id: '123' });

    const firstPromise = {
      then: vi.fn(function (resolve) {
        return Promise.resolve(resolve(mockTransaction));
      }),
    };

    mockKnex = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      whereIn: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      first: vi.fn().mockReturnValue(firstPromise),
      then: vi.fn(function (resolve) {
        return Promise.resolve(resolve([mockTransaction]));
      }),
    };

    context = {
      user: { id: 'user-1' },
      services: {
        knex: vi.fn(() => mockKnex),
      },
    };

    vi.clearAllMocks();
  });

  it('uses default limit of 50 (+1) if not provided', async () => {
     // @ts-ignore
     await resolvers.Query.transactionLedgerList(null, {}, context);
     expect(mockKnex.limit).toHaveBeenCalledWith(51);
  });

  it('uses provided limit (+1)', async () => {
     const args = { limit: 10 };
     // @ts-ignore
     await resolvers.Query.transactionLedgerList(null, args, context);
     expect(mockKnex.limit).toHaveBeenCalledWith(11);
  });

  it('uses cursor for pagination', async () => {
     const args = { limit: 10, cursor: 'prev-cursor-id' };
     // @ts-ignore
     await resolvers.Query.transactionLedgerList(null, args, context);
     expect(mockKnex.andWhere).toHaveBeenCalled();
  });

  it('returns cursor in response', async () => {
     // @ts-ignore
     const result = await resolvers.Query.transactionLedgerList(null, {}, context);
     expect(result).toHaveProperty('cursor');
  });
});
