import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import { merge } from 'lodash';
import type { NextRequest } from 'next/server';
import { createContext } from '@/lib/context';
import type { IContext } from '@/lib/types';
import {
  resolvers as categoryResolvers,
  typeDefs as categoryTypeDefs,
} from './category';
import {
  resolvers as spaceResolvers,
  typeDefs as spaceTypeDefs,
} from './space';
import {
  resolvers as transactionLedgerResolvers,
  typeDefs as transactionLedgerTypeDefs,
} from './transaction-ledger';
import { resolvers as userResolvers, typeDefs as userTypeDefs } from './user';

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;

function BigIntCoerce(value: unknown): number {
  const num = Number(value);

  if (
    Number.isInteger(num) !== true ||
    num > MAX_SAFE_INTEGER ||
    num < MIN_SAFE_INTEGER
  ) {
    throw new GraphQLError('BigInt must be a safe integer');
  }

  return num;
}

const BigIntResolver = new GraphQLScalarType({
  name: 'BigInt',
  description: 'Custom scalar type for handling arbitrary-length integers',

  serialize: BigIntCoerce,
  parseValue: BigIntCoerce,
  parseLiteral(ast: ValueNode): number | null {
    if (ast.kind === Kind.INT) {
      const n = parseInt(ast.value, 10);

      if (n > MAX_SAFE_INTEGER || n < MIN_SAFE_INTEGER) {
        throw new GraphQLError('BigInt must be a safe integer');
      }

      return n;
    }

    return null;
  },
});

const baseTypeDefs = `#graphql
  scalar UUID
  scalar BigInt

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

const server = new ApolloServer<IContext>({
  typeDefs: [
    baseTypeDefs,
    userTypeDefs,
    categoryTypeDefs,
    spaceTypeDefs,
    transactionLedgerTypeDefs,
    spaceTypeDefs,
  ].flat(),
  resolvers: merge(
    { BigInt: BigIntResolver },
    userResolvers,
    categoryResolvers,
    spaceResolvers,
    transactionLedgerResolvers,
    spaceResolvers,
  ),
  plugins: [
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
});

const handler = startServerAndCreateNextHandler(server, {
  context: createContext,
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
