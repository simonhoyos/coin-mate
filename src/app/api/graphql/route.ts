import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";

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
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req, res) => ({
    req,
    res,
  }),
});

export { handler as GET, handler as POST };
