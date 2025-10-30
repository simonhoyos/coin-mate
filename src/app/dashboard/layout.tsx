import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const meQuery = useQuery<{
    me?: {
      id: string;
    };
  }>(
    gql`
      query MeQueryFromDashboard {
        me {
          id
        }
      }
    `,
  );

  const meData = meQuery.data;

  if (meData?.me?.id != null) {
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col py-4 md:py-6 px-4 lg:px-6">
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
