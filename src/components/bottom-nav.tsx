'use client';

import { IconUserCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsMobileResolved } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { type NavItem, navItems } from './nav-items';
import { UserMenu } from './user-menu';

const BAR_ORDER = [
  '/dashboard',
  '/dashboard/categories',
  '/dashboard/history',
  '/dashboard/spaces',
];

const PRIMARY_URL = '/dashboard/history';

const barItems = BAR_ORDER.map((url) =>
  navItems.find((item) => item.url === url),
).filter((item): item is NavItem => item !== undefined);

const itemClassName =
  'flex h-full w-full flex-col items-center justify-end gap-1 pb-2 text-xs';

export function BottomNav(props: { email?: string | undefined }) {
  const pathname = usePathname();
  const isMobile = useIsMobileResolved() === true;

  if (!isMobile) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-5 items-end">
        {barItems.map((item) => {
          const isActive = pathname === item.url;
          const isPrimary = item.url === PRIMARY_URL;

          return (
            <li key={item.url} className="h-full">
              <Link
                href={item.url}
                aria-current={isActive ? 'page' : undefined}
                data-primary={isPrimary ? '' : undefined}
                className={cn(
                  itemClassName,
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {isPrimary ? (
                  <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                    <item.icon className="size-7" />
                  </span>
                ) : (
                  <item.icon className="size-6" />
                )}
                <span>{item.title}</span>
              </Link>
            </li>
          );
        })}
        <li className="h-full">
          <UserMenu email={props.email} side="top" align="end">
            <button
              type="button"
              className={cn(itemClassName, 'text-muted-foreground')}
            >
              <IconUserCircle className="size-6" />
              <span>Account</span>
            </button>
          </UserMenu>
        </li>
      </ul>
    </nav>
  );
}
