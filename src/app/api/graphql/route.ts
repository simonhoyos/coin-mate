import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type Dataloader from 'dataloader';
import jwt from 'jsonwebtoken';
import { merge } from 'lodash';
import type { NextRequest } from 'next/server';
import { createConfig } from '@/lib/config';
import { connect } from '@/lib/database';
import { getSession } from '@/lib/session';
import type { IContext, IGlobalCache } from '@/lib/types';
import {
  resolvers as categoryResolvers,
  typeDefs as categoryTypeDefs,
} from './category';
import {
  resolvers as transactionLedgerResolvers,
  typeDefs as transactionLedgerTypeDefs,
} from './transaction-ledger';
import { resolvers as userResolvers, typeDefs as userTypeDefs } from './user';

const baseTypeDefs = `#graphql
  scalar UUID

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
    transactionLedgerTypeDefs,
  ].flat(),
  resolvers: merge(
    userResolvers,
    categoryResolvers,
    transactionLedgerResolvers,
  ),
  plugins: [
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => ({
    req,

    ...(await createContext()),
  }),
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

const globalCache: IGlobalCache = {
  knex: undefined,
};

async function createContext() {
  const destroyers: (() => Promise<unknown>)[] = [];

  const { knex, cleanup: knexCleanup } = connect({ globalCache });

  destroyers.push(knexCleanup);

  async function cleanup() {
    return Promise.all(destroyers.map((destroy) => destroy()));
  }

  const config = createConfig();

  const session = await getSession();

  const sessionPayload =
    session?.value != null
      ? jwt.verify(session.value, config.JWT_SECRET)
      : null;

  const user =
    typeof sessionPayload?.sub === 'string'
      ? {
          id: sessionPayload.sub,
        }
      : null;

  return {
    config,

    services: {
      knex: knex,
    },

    user,

    dl: new Map<symbol, Dataloader<unknown, unknown>>(),

    cleanup,
  };
}
