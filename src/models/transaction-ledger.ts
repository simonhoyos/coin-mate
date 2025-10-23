import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';
import { User } from './user';

export class TransactionLedger {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  concept!: string;
  description?: string | undefined;
  currency!: string;
  amount_cents!: number;
  transacted_at!: Date | string;
  type!: string;

  user_id!: string;
  category_id!: string;

  archived_at?: Date | string | null;

  static async create(args: {
    context: IContext;
    data: z.infer<typeof TransactionLedgerCreateSchema>;
  }) {
    TransactionLedgerCreateSchema.parse(args.data);

    const userId = assertNotNull(
      args.context.user?.id,
      'User must be authenticated to update a category',
    );

    await User.gen({
      context: args.context,
      id: userId,
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          concept: args.data.concept,
          description: args.data.description,
          currency: args.data.currency,
          amount_cents: args.data.amount_cents,
          transacted_at: args.data.transacted_at,
          type: args.data.type,

          category_id: args.data.category_id,
        };

        const [transactionLedger] = await trx<TransactionLedger>(
          'transaction_ledger',
        ).insert(payload, '*');

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'category',
            object_id: assertNotNull(
              transactionLedger?.id,
              'Transaction ledger could not be created',
            ),
            operation: 'create',
            payload,
          },
        });

        return {
          transactionLedger,
        };
      },
    );

    return {
      category: trxResult.transactionLedger,
    };
  }
}

const CurrencyEnum = z.enum(['COP', 'USD']);
const TypeEnum = z.enum(['income', 'expense']);

const TransactionLedgerCreateSchema = z.object({
  concept: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  currency: CurrencyEnum,
  amount_cents: z.number().int(),
  transacted_at: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) {
      return new Date(arg);
    }
  }, z.date()),
  type: TypeEnum,
  category_id: z.uuid(),
});
