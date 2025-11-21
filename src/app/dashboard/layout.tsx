'use client';

import { CombinedGraphQLErrors, gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const meQuery = useQuery<{
    me?: {
      id: string;

      email?: string;
    };
  }>(
    gql`
      query MeQueryFromDashboard {
        me {
          id

          email
        }
      }
    `,
    {
      ssr: false,
    },
  );

  if (meQuery.loading === true) {
    return (
      <div className="flex flex-1 justify-center">
        <Spinner className="size-12 text-primary mt-10" />
      </div>
    );
  }

  const meError = meQuery.error;

  if (meError != null && CombinedGraphQLErrors.is(meError)) {
    redirect('/signin');
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        email={meQuery.data?.me?.email}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col py-4 md:py-6 px-4 lg:px-6">
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
