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
    transactionLedgerList(type: TransactionLedgerType): TransactionLedgerConnection
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
      args: { type?: string },
      context: IContext,
    ) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const type = TypeEnum.parse(args.type ?? 'expense');

      const transactions = await context.services
        .knex<TransactionLedger>('transaction_ledger')
        .where({ user_id: context.user.id, type })
        .whereNull('archived_at')
        .orderBy('transacted_at', 'desc')
        .limit(50);

      return {
        edges: compact(
          await Promise.all(
            transactions.map((transaction) =>
              TransactionLedger.gen({ context, id: transaction.id }).then(
                (transaction) =>
                  transaction != null ? { id: transaction.id } : undefined,
              ),
            ),
          ),
        ),
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
