import { addHours, format } from 'date-fns';
import { omitBy } from 'lodash';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';
import type { Space } from './space';
import { User } from './user';

export class TransactionLedger {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  concept!: string;
  description?: string | undefined | null;
  currency!: string;
  original_currency!: string;
  amount_cents!: number;
  original_amount_cents!: number;
  transacted_at!: string;
  type!: string;

  user_id!: string;
  category_id!: string;
  space_id!: string;

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
      'User must be authenticated to create a transaction',
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
        const space = await trx<Space>('space')
          .select('space.id')
          .where({
            user_id: userId,
          })
          .limit(1)
          .first();

        const payload = omitBy(
          {
            concept: parsedData.concept,
            description:
              (parsedData.description ?? '') !== ''
                ? parsedData.description
                : null,

            original_currency: parsedData.currency,
            currency: parsedData.currency,

            original_amount_cents: parsedData.amount_cents,
            amount_cents: parsedData.amount_cents,

            transacted_at: parsedData.transacted_at,
            type: parsedData.type,

            user_id: userId,
            category_id: parsedData.category_id,
            space_id: assertNotNull(space?.id, 'Space not found for the user'),
          },
          (value) => value == null,
        );

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
              'Transaction could not be created',
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

  static async update(args: {
    context: IContext;
    data: {
      id: string;

      concept: string;
      description: string | undefined;
      currency: string;
      amount_cents: string;
      transacted_at: string;
      type: string;

      category_id: string;
    };
  }) {
    const parsedData = TransactionLedgerUpdateSchema.parse(args.data);

    const userId = assertNotNull(
      args.context.user?.id,
      'User must be authenticated to update a transaction',
    );

    await User.gen({
      context: args.context,
      id: userId,
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    await TransactionLedger.gen({
      context: args.context,
      id: parsedData.id,
    }).then((category) => {
      if (category == null) {
        throw new Error('Transaction not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          concept: parsedData.concept,
          description:
            (parsedData.description ?? '') !== ''
              ? parsedData.description
              : null,

          original_currency: parsedData.currency,
          currency: parsedData.currency,

          original_amount_cents: parsedData.amount_cents,
          amount_cents: parsedData.amount_cents,

          transacted_at: parsedData.transacted_at,
          type: parsedData.type,

          category_id: parsedData.category_id,
        };

        const [transaction] = await trx<TransactionLedger>('transaction_ledger')
          .update(payload, '*')
          .where({
            id: args.data.id,
          });

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'transaction_ledger',
            object_id: assertNotNull(
              transaction?.id,
              'Transaction could not be updated',
            ),
            operation: 'update',
            payload,
          },
        });

        return {
          transaction,
        };
      },
    );

    return {
      transaction: trxResult.transaction,
    };
  }

  static async delete(args: {
    context: IContext;
    data: {
      id: string;
    };
  }) {
    const parsedData = TransactionLedgerDeleteSchema.parse(args.data);

    const userId = assertNotNull(
      args.context.user?.id,
      'User must be authenticated to update a transaction',
    );

    await User.gen({
      context: args.context,
      id: userId,
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    await TransactionLedger.gen({
      context: args.context,
      id: parsedData.id,
    }).then((category) => {
      if (category == null) {
        throw new Error('Category not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          archived_at: new Date(),
        };

        const [transaction] = await trx<TransactionLedger>('transaction_ledger')
          .update(payload, '*')
          .where({
            id: args.data.id,
          });

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'transaction_ledger',
            object_id: assertNotNull(
              transaction?.id,
              'Transaction could not be updated',
            ),
            operation: 'delete',
            payload,
          },
        });

        return {
          transaction,
        };
      },
    );

    return {
      transaction: trxResult.transaction,
    };
  }
}

export const CurrencyEnum = z.enum(['COP', 'USD']);
export const TypeEnum = z.enum(['income', 'expense', 'saving']);

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

const TransactionLedgerUpdateSchema = TransactionLedgerCreateSchema.extend({
  id: z.uuid(),
});

const TransactionLedgerDeleteSchema = z.object({
  id: z.uuid(),
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
        'transaction_ledger.type',

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
      | 'type'
      | 'category_id'
      | 'user_id'
    >[];

    return args.keys.map(
      (key) => transactions.find((t) => t.id === key) || null,
    );
  },
);
