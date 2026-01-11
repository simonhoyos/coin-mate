import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvers } from './index';

vi.mock('@/models/transaction-ledger', () => ({
  TypeEnum: {
    parse: vi.fn((v) => v),
  },
  TransactionLedger: {
    gen: vi.fn().mockResolvedValue({ id: '123' }),
  },
}));

describe('transactionLedgerList pagination', () => {
  let mockKnex: any;
  let context: any;

  beforeEach(() => {
    mockKnex = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn(function (resolve) {
        return Promise.resolve(resolve([
          { id: '123', transacted_at: new Date().toISOString() }
        ]));
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

  it('uses default limit of 50 if not provided', async () => {
     // @ts-expect-error
     await resolvers.Query.transactionLedgerList(null, {}, context);

     expect(mockKnex.limit).toHaveBeenCalledWith(50);
  });

  it('uses provided limit', async () => {
     const args = { limit: 10 };
     // @ts-expect-error
     await resolvers.Query.transactionLedgerList(null, args, context);

     expect(mockKnex.limit).toHaveBeenCalledWith(11);
  });

  it('uses cursor for pagination', async () => {
     const args = { limit: 10, cursor: 'prev-cursor-id' };
     // @ts-expect-error
     await resolvers.Query.transactionLedgerList(null, args, context);

     expect(mockKnex.andWhere).toHaveBeenCalled();
  });

  it('returns cursor in response', async () => {
     // @ts-expect-error
     const result = await resolvers.Query.transactionLedgerList(null, {}, context);

     expect(result).toHaveProperty('cursor');
  });
});
