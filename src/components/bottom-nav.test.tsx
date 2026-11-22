import { MockedProvider } from '@apollo/client/testing/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomNav } from './bottom-nav';
import { navItems } from './nav-items';

const mobileState = vi.hoisted(() => ({
  isMobile: true as boolean | undefined,
}));
const navState = vi.hoisted(() => ({ pathname: '/dashboard' }));
const replace = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => mobileState.isMobile,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ replace }),
}));

function renderBar() {
  return render(
    <MockedProvider mocks={[]}>
      <BottomNav email="ana@example.com" />
    </MockedProvider>,
  );
}

function getBar() {
  return screen.getByRole('navigation', { name: 'Mobile navigation' });
}

function getItems() {
  return within(getBar()).getAllByRole('listitem');
}

describe('BottomNav', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mobileState.isMobile = true;
    navState.pathname = '/dashboard';
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('renders five items in order with links to the nav routes', () => {
    renderBar();

    const items = getItems();
    expect(items).toHaveLength(5);

    const names = items.map((item) =>
      (
        within(item).getByRole(item.querySelector('a') ? 'link' : 'button')
          .textContent ?? ''
      ).trim(),
    );
    expect(names).toEqual([
      'Dashboard',
      'Categories',
      'History',
      'Spaces',
      'Account',
    ]);

    const hrefs = within(getBar())
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual([
      '/dashboard',
      '/dashboard/categories',
      '/dashboard/history',
      '/dashboard/spaces',
    ]);
  });

  it('has a bar link for every nav item', () => {
    renderBar();

    const hrefs = within(getBar())
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect([...hrefs].sort()).toEqual(navItems.map((item) => item.url).sort());
  });

  it('is fixed to the bottom, hidden from md up, and safe-area padded', () => {
    renderBar();

    const classes = getBar().className.split(/\s+/);
    expect(classes).toEqual(
      expect.arrayContaining([
        'fixed',
        'bottom-0',
        'md:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      ]),
    );
  });

  it('puts History in the middle styled as the primary button', () => {
    renderBar();

    const history = within(getItems()[2] as HTMLElement).getByRole('link', {
      name: 'History',
    });
    expect(history.hasAttribute('data-primary')).toBe(true);
    const circle = history.querySelector('.bg-primary');
    expect(circle).not.toBeNull();
    expect(circle?.className).toContain('rounded-full');

    const marked = getBar().querySelectorAll('[data-primary]');
    expect(marked).toHaveLength(1);
  });

  it('marks only the Categories link active on /dashboard/categories', () => {
    navState.pathname = '/dashboard/categories';
    renderBar();

    const active = getBar().querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toContain('Categories');
  });

  it('marks only History active on /dashboard/history', () => {
    navState.pathname = '/dashboard/history';
    renderBar();

    const active = getBar().querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toContain('History');
  });

  it('marks nothing active on a nested route', () => {
    navState.pathname = '/dashboard/history/123';
    renderBar();

    expect(getBar().querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('opens the user menu upward with the email and Log out', () => {
    renderBar();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Account' }), {
      key: 'Enter',
    });

    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeDefined();
    expect(screen.getByRole('menu').getAttribute('data-side')).toBe('top');
  });

  it.each([false, undefined])(
    'renders nothing when useIsMobileResolved is %s',
    (value) => {
      mobileState.isMobile = value;
      renderBar();

      expect(
        screen.queryByRole('navigation', { name: 'Mobile navigation' }),
      ).toBeNull();
    },
  );
});
