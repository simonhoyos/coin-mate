import { format } from 'date-fns';
import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { TransactionLedger, TypeEnum } from '@/models/transaction-ledger';

export const typeDefs = `#graphql
  type TransactionLedger {
    id: UUID!

    concept: String
    description: String
    currency: String
    amount_cents: Int
    transacted_at: String
    type: String

    category: Category
  }

  type TransactionLedgerConnection {
    edges: [TransactionLedger]
    cursor: String
  }

  input TransactionLedgerCreateInput {
    concept: String!
    description: String
    currency: String!
    amount: String!
    transacted_at: String!
    type: String!

    category_id: UUID
  }

  input TransactionLedgerUpdateInput {
    id: UUID!

    concept: String!
    description: String
    currency: String!
    amount: String!
    transacted_at: String!
    type: String!

    category_id: UUID
  }

  input TransactionLedgerDeleteInput {
    id: UUID!
  }

  enum TransactionLedgerType {
    expense
    income
    saving
  }

  extend type Query {
    transactionLedgerList(type: TransactionLedgerType, limit: Int, cursor: String): TransactionLedgerConnection
  }

  extend type Mutation {
    transactionLedgerCreate(input: TransactionLedgerCreateInput!): TransactionLedger
    transactionLedgerUpdate(input: TransactionLedgerUpdateInput!): TransactionLedger
    transactionLedgerDelete(input: TransactionLedgerDeleteInput!): TransactionLedger
  }
`;

export const resolvers = {
  TransactionLedger: {
    concept: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.concept,
      ),

    description: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.description,
      ),

    currency: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.currency,
      ),

    amount_cents: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.amount_cents,
      ),

    transacted_at: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then((transaction) =>
        transaction?.transacted_at != null
          ? format(transaction?.transacted_at, 'yyyy-MM-dd')
          : undefined,
      ),

    type: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.type,
      ),

    category: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then((transaction) =>
        transaction?.category_id != null
          ? { id: transaction.category_id }
          : undefined,
      ),
  },

  Query: {
    async transactionLedgerList(
      _parent: never,
      args: { type?: string; limit?: number; cursor?: string },
      context: IContext,
    ) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const type = TypeEnum.parse(args.type ?? 'expense');
      const limit = args.limit ?? 50;
      const cursor = args.cursor;

      let query = context.services
        .knex<TransactionLedger>('transaction_ledger')
        .where({ user_id: context.user.id, type })
        .whereNull('archived_at')
        .orderBy('transacted_at', 'desc')
        .orderBy('id', 'desc')
        .limit(limit + 1);

      if (cursor) {
        const cursorTransaction = await context.services
          .knex<TransactionLedger>('transaction_ledger')
          .where({ id: cursor })
          .first();

        if (cursorTransaction) {
          query = query.andWhere((qb) => {
            qb.where('transacted_at', '<', cursorTransaction.transacted_at).orWhere(
              (qb2) => {
                qb2
                  .where('transacted_at', '=', cursorTransaction.transacted_at)
                  .andWhere('id', '<', cursorTransaction.id);
              },
            );
          });
        }
      }

      const transactions = await query;

      const hasNextPage = transactions.length > limit;
      const results = hasNextPage ? transactions.slice(0, limit) : transactions;

      return {
        edges: compact(
          await Promise.all(
            results.map((transaction) =>
              TransactionLedger.gen({ context, id: transaction.id }).then(
                (transaction) =>
                  transaction != null ? { id: transaction.id } : undefined,
              ),
            ),
          ),
        ),
        cursor: hasNextPage ? results[results.length - 1]?.id : null,
      };
    },
  },

  Mutation: {
    async transactionLedgerCreate(
      _parent: never,
      args: {
        input: {
          concept: string;
          description: string | undefined;
          currency: string;
          amount: string;
          transacted_at: string;
          type: string;
          category_id: string;
        };
      },
      context: IContext,
    ) {
      const transactionLedgerResult = await TransactionLedger.create({
        context,
        data: {
          ...args.input,
          transacted_at: `${args.input.transacted_at}T12:00:00.000Z`,
          amount_cents: args.input.amount,
        },
      });

      return { id: transactionLedgerResult.transactionLedger?.id };
    },

    async transactionLedgerUpdate(
      _parent: never,
      args: {
        input: {
          id: string;
          concept: string;
          description: string | undefined;
          currency: string;
          amount: string;
          transacted_at: string;
          type: string;
          category_id: string;
        };
      },
      context: IContext,
    ) {
      const transactionLedgerResult = await TransactionLedger.update({
        context,
        data: {
          ...args.input,
          amount_cents: args.input.amount,
        },
      });

      return { id: transactionLedgerResult.transaction?.id };
    },

    async transactionLedgerDelete(
      _parent: never,
      args: {
        input: {
          id: string;
        };
      },
      context: IContext,
    ) {
      const transactionLedgerResult = await TransactionLedger.delete({
        context,
        data: args.input,
      });

      return { id: transactionLedgerResult.transaction?.id };
    },
  },
};
