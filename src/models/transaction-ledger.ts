import { addHours, format } from 'date-fns';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
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
  transacted_at!: string;
  type!: string;

  user_id!: string;
  category_id!: string;

  archived_at?: Date | string | null;

  static async gen(args: { context: IContext; id: string }) {
    const record = await getTransactionLedgerById({
      context: args.context,
      id: args.id,
    });

    return record?.user_id != null && record.user_id === args.context.user?.id
      ? record
      : null;
  }

  static async create(args: {
    context: IContext;
    data: {
      concept: string;
      description: string | undefined;
      currency: string;
      amount_cents: string;
      transacted_at: string;
      type: string;

      category_id: string;
    };
  }) {
    const parsedData = TransactionLedgerCreateSchema.parse(args.data);

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
          concept: parsedData.concept,
          description: parsedData.description,
          currency: parsedData.currency,
          amount_cents: parsedData.amount_cents,
          transacted_at: parsedData.transacted_at,
          type: parsedData.type,

          user_id: userId,
          category_id: parsedData.category_id,
        };

        const [transactionLedger] = await trx<TransactionLedger>(
          'transaction_ledger',
        ).insert(payload, '*');

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'transaction_ledger',
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
      transactionLedger: trxResult.transactionLedger,
    };
  }
}

export const CurrencyEnum = z.enum(['COP', 'USD']);
export const TypeEnum = z.enum(['income', 'expense']);

const TransactionLedgerCreateSchema = z.object({
  concept: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  currency: CurrencyEnum,
  amount_cents: z
    .string()
    .regex(/^\d+\.\d{2}$/, 'Unsupported amount format, expected format: 0.00')
    .transform((value) => parseInt(value.replace('.', ''), 10))
    .pipe(z.number()),
  transacted_at: z
    .string()
    .transform((value) =>
      addHours(format(new Date(value), 'yyyy-MM-dd'), 12).toISOString(),
    )
    .pipe(z.iso.datetime()),
  type: TypeEnum,
  category_id: z.uuid(),
});

const getTransactionLedgerById = createLoader(
  async (args: { context: IContext; keys: readonly string[] }) => {
    const transactions = (await args.context.services
      .knex<TransactionLedger>('transaction_ledger')
      .select([
        'transaction_ledger.id',

        'transaction_ledger.concept',
        'transaction_ledger.description',
        'transaction_ledger.currency',
        'transaction_ledger.amount_cents',
        'transaction_ledger.transacted_at',

        'transaction_ledger.category_id',

        'transaction_ledger.user_id',
      ])
      .whereIn('id', args.keys)
      .whereNull('archived_at')) as unknown as Pick<
      TransactionLedger,
      | 'id'
      | 'concept'
      | 'description'
      | 'currency'
      | 'amount_cents'
      | 'transacted_at'
      | 'category_id'
      | 'user_id'
    >[];

    return args.keys.map(
      (key) => transactions.find((t) => t.id === key) || null,
    );
  },
);
