import { MockedProvider } from '@apollo/client/testing/react';
import { cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

const mobileState = vi.hoisted(() => ({
  isMobile: true as boolean | undefined,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => mobileState.isMobile,
  useIsMobile: () => !!mobileState.isMobile,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
}));

function OpenDrawer() {
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    setOpenMobile(true);
  }, [setOpenMobile]);
  return null;
}

function renderSidebar() {
  return render(
    <MockedProvider mocks={[]}>
      <SidebarProvider>
        <OpenDrawer />
        <AppSidebar email="ana@example.com" />
      </SidebarProvider>
    </MockedProvider>,
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    cleanup();
    mobileState.isMobile = true;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('renders nothing on mobile, even when the drawer is opened', () => {
    renderSidebar();

    expect(document.querySelector('[data-slot="sidebar"]')).toBeNull();
    expect(screen.queryByRole('link', { name: /CoinMate/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
  });

  it('renders the logo, nav links and user email on desktop', () => {
    mobileState.isMobile = false;
    renderSidebar();

    expect(screen.getByRole('link', { name: /CoinMate/ })).toBeDefined();
    const names = screen
      .getAllByRole('link')
      .map((link) => link.textContent?.trim())
      .filter((text) => text !== '' && !text?.includes('CoinMate'));
    expect(names).toEqual(['Dashboard', 'History', 'Categories', 'Spaces']);
    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
  });
});
