'use client';

import {
  IconBuildingBank,
  IconCategory,
  IconDashboard,
} from '@tabler/icons-react';
import Link from 'next/link';
import type * as React from 'react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Logo } from './ui/logo';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Expenses',
      url: '/dashboard/expenses',
      icon: IconBuildingBank,
    },
    {
      title: 'Categories',
      url: '/dashboard/categories',
      icon: IconCategory,
    },
  ],
};

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { email?: string | undefined }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Logo className="w-64 h-64" />
                <span className="text-base font-semibold">CoinMate</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser email={props.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
