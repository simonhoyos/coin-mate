'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobileResolved } from '@/hooks/use-mobile';

export function SiteHeader() {
  const viewport = useIsMobileResolved();

  return (
    <header
      className="sticky top-0 z-50 bg-background flex h-(--header-height) 
      shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear 
      group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {viewport !== true && (
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
