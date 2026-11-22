'use client';

import Link from 'next/link';
import type * as React from 'react';
import { navItems } from '@/components/nav-items';
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
import { useIsMobileResolved } from '@/hooks/use-mobile';
import { Logo } from './ui/logo';

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { email?: string | undefined }) {
  if (useIsMobileResolved() === true) {
    return null;
  }

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
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser email={props.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
