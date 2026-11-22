'use client';

import { IconDotsVertical } from '@tabler/icons-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserAvatar, UserMenu } from './user-menu';

export function NavUser(props: { email?: string | undefined }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu email={props.email} side={isMobile ? 'bottom' : 'right'}>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <UserAvatar email={props.email} className="grayscale" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{props.email}</span>
              <span className="text-muted-foreground truncate text-xs">
                {props.email}
              </span>
            </div>
            <IconDotsVertical className="ml-auto size-4" />
          </SidebarMenuButton>
        </UserMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
