'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-items';
import { Button } from './ui/button';

export function NavMain({ items }: { items: readonly NavItem[] }) {
  const { setOpenMobile } = useSidebar();

  const onLinkClick = () => {
    setOpenMobile(false);
  };

  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Button
                  className={cn(
                    'p-0 justify-start',
                    pathname === item.url && 'bg-sidebar-accent',
                  )}
                  variant="ghost"
                  asChild
                >
                  <Link href={item.url} onClick={onLinkClick}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
