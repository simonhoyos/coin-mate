import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type Dataloader from 'dataloader';
import type { NextRequest } from 'next/server';
import { createConfig } from '@/lib/config';
import { connect } from '@/lib/database';
import type { IContext, IGlobalCache } from '@/lib/types';
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
  typeDefs: [baseTypeDefs, userTypeDefs].flat(),
  resolvers: userResolvers,
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

  return {
    config: createConfig(),

    services: {
      knex: knex,
    },

    dl: new Map<symbol, Dataloader<unknown, unknown>>(),

    cleanup,
  };
}
