'use client';

import { IconDotsVertical } from '@tabler/icons-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserAvatar, UserIdentity, UserMenu } from './user-menu';

export function NavUser(props: { email?: string | undefined }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu email={props.email} side="right">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <UserAvatar email={props.email} className="grayscale" />
            <UserIdentity email={props.email} />
            <IconDotsVertical className="ml-auto size-4" />
          </SidebarMenuButton>
        </UserMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
