import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

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
  redirect: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

const meMock = {
  request: {
    query: gql`
      query MeQueryFromDashboard {
        me {
          id

          email
        }
      }
    `,
  },
  result: {
    data: { me: { __typename: 'User', id: '1', email: 'ana@example.com' } },
  },
};

async function renderLayout() {
  render(
    <MockedProvider mocks={[meMock]}>
      <DashboardLayout>
        <p>page body</p>
      </DashboardLayout>
    </MockedProvider>,
  );
  await screen.findByText('page body');
}

describe('DashboardLayout', () => {
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

  it('shows the bottom bar and no sidebar or trigger on mobile', async () => {
    await renderLayout();

    expect(
      screen.getByRole('navigation', { name: 'Mobile navigation' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Toggle Sidebar' })).toBeNull();
    expect(document.querySelector('[data-slot="sidebar"]')).toBeNull();
  });

  it('shows the email from the me query in the bar account menu', async () => {
    await renderLayout();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Account' }), {
      key: 'Enter',
    });

    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeDefined();
  });

  it('shows the sidebar and trigger, and no bottom bar, on desktop', async () => {
    mobileState.isMobile = false;
    await renderLayout();

    expect(document.querySelector('[data-slot="sidebar"]')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Toggle Sidebar' }),
    ).toBeDefined();
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).toBeNull();
  });

  it('pads the content bottom on mobile and keeps md:py-6', async () => {
    await renderLayout();

    const wrapper = screen.getByText('page body').parentElement;
    expect(wrapper?.className).toContain(
      'pb-[calc(6rem+env(safe-area-inset-bottom))]',
    );
    expect(wrapper?.className).toContain('md:py-6');
  });
});
