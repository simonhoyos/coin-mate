import type { IContext } from '@/lib/types';
import { CurrencyEnum, TransactionLedger, TypeEnum } from '@/models/transaction-ledger';

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

  input TransactionLedgerCreateInput {
    concept: String!
    description: String
    currency: String!
    amount_cents: Int!
    transacted_at: String!
    type: String!

    category_id: UUID
  }

  extend type Mutation {
    transactionLedgerCreate(input: TransactionLedgerCreateInput!): TransactionLedger
  }
`;

export const resolvers = {
  Mutation: {
    async transactionLedgerCreate(_parent: never, args: {
      input: {
        concept: string;
        description: string | undefined;
        currency: string;
        amount_cents: number;
        transacted_at: string;
        type: string;
        category_id: string;
      }
    }, context: IContext) {
      const {
        concept,
        description,
        currency,
        amount_cents,
        transacted_at,
        type,
        category_id,
      } = args.input;

      const transactionLedgerResult = await TransactionLedger.create({
        context,
        data: {
          concept,
          description,
          currency: CurrencyEnum.parse(currency),
          amount_cents,
          transacted_at,
          type: TypeEnum.parse(type),

          category_id,
        },
      });

      return { id: transactionLedgerResult.transactionLedger?.id };
    },
  },
};
