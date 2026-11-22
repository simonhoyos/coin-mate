import { MockedProvider } from '@apollo/client/testing/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { stubResizeObserver } from '@/test/resize-observer';
import { NavUser } from './nav-user';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => false,
  useIsMobile: () => false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('NavUser', () => {
  beforeEach(() => {
    cleanup();
    stubResizeObserver();
  });

  it('opens the user menu to the right with a Log out item', () => {
    render(
      <MockedProvider mocks={[]}>
        <SidebarProvider>
          <NavUser email="ana@example.com" />
        </SidebarProvider>
      </MockedProvider>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /ana@example.com/ }), {
      key: 'Enter',
    });

    expect(screen.getByRole('menu').getAttribute('data-side')).toBe('right');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeDefined();
  });
});
