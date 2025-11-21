'use client';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { IconDotsVertical, IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const AVATAR = '/avatars/shadcn.jpg';

export function NavUser(props: {
  email?: string | undefined;
}) {
  const router = useRouter();

  const { isMobile } = useSidebar();

  const [logoutMutation, logoutState] = useMutation<{
    userLogout: {
      success?: boolean;
    };
  }>(
    gql`
      mutation UserLogout {
        userLogout {
          success
        }
      }
    `,
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={AVATAR} alt={props.email} />
                <AvatarFallback className="rounded-lg">{props.email?.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{props.email}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {props.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={AVATAR} alt={props.email} />
                  <AvatarFallback className="rounded-lg">{props.email?.slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{props.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {props.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const logoutData = await logoutMutation();

                if (logoutData.data?.userLogout.success === true) {
                  router.replace('/signin');
                }
              }}
              disabled={logoutState.loading}
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
