import { HttpLink } from '@apollo/client';
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from '@apollo/client-integration-nextjs';

export function getSSRApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),

    link: new HttpLink({
      uri: `/api/graphql`,
      fetchOptions: { cache: 'no-store' },
      credentials: 'same-origin',
    }),
  });
}

export const { getClient, query, PreloadQuery } =
  registerApolloClient(getSSRApolloClient);
