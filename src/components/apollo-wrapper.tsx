'use client';

import { HttpLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

export function makeApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),

    link: new HttpLink({
      uri: `/api/graphql`,
      fetchOptions: { cache: 'no-store' },
      credentials: 'same-origin',
    }),
  });
}

export function ApolloWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ApolloNextAppProvider makeClient={makeApolloClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
