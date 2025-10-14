import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type { NextRequest } from 'next/server';

const baseTypeDefs = `#graphql
  scalar UUID

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

const server = new ApolloServer({
  typeDefs: [baseTypeDefs],
  resolvers: [],
  plugins: [
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({
    req,
  }),
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
