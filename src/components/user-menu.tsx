'use client';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import type * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const AVATAR = '/avatars/shadcn.jpg';

export function UserAvatar(props: {
  email?: string | undefined;
  className?: string;
}) {
  return (
    <Avatar className={cn('h-8 w-8 rounded-lg', props.className)}>
      <AvatarImage src={AVATAR} alt={props.email} />
      <AvatarFallback className="rounded-lg">
        {props.email?.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserMenu(props: {
  email?: string | undefined;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
  align?: 'start' | 'center' | 'end' | undefined;
}) {
  const router = useRouter();

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={props.side ?? 'bottom'}
        align={props.align ?? 'end'}
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserAvatar email={props.email} />
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
            try {
              const logoutData = await logoutMutation();

              if (logoutData.data?.userLogout.success === true) {
                router.replace('/signin');
              }
            } catch (error) {
              // The user stays signed in on the page; no toaster is mounted.
              console.error('Logout failed', error);
            }
          }}
          disabled={logoutState.loading}
        >
          <IconLogout />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
