import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { TransactionLedger } from '@/models/transaction-ledger';

export const typeDefs = `#graphql
  type TransactionLedger {
    id: UUID!

    concept: String
    description: String
    currency: String
    amount_cents: Int
    transacted_at: String

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

  extend type Query {
    transactionList: TransactionLedgerConnection
  }

  extend type Mutation {
    transactionLedgerCreate(input: TransactionLedgerCreateInput!): TransactionLedger
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
      TransactionLedger.gen({ context, id: parent.id }).then(
        (transaction) => transaction?.transacted_at,
      ),

    category: (parent: { id: string }, _args: never, context: IContext) =>
      TransactionLedger.gen({ context, id: parent.id }).then((transaction) =>
        transaction?.category_id != null
          ? { id: transaction.category_id }
          : undefined,
      ),
  },

  Query: {
    async transactionList(_parent: never, _args: never, context: IContext) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const transactions = await context.services
        .knex<TransactionLedger>('transaction_ledger')
        .where({ user_id: context.user.id })
        .orderBy('transacted_at', 'desc');

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
      const {
        concept,
        description,
        currency,
        amount,
        transacted_at,
        type,
        category_id,
      } = args.input;

      const transactionLedgerResult = await TransactionLedger.create({
        context,
        data: {
          concept,
          description,
          currency,
          amount_cents: amount,
          transacted_at,
          type,

          category_id,
        },
      });

      return { id: transactionLedgerResult.transactionLedger?.id };
    },
  },
};
