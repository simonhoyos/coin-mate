import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from './user-menu';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

const USER_LOGOUT = gql`
  mutation UserLogout {
    userLogout {
      success
    }
  }
`;

function logoutMock(success: boolean) {
  return {
    request: { query: USER_LOGOUT },
    result: { data: { userLogout: { __typename: 'UserLogout', success } } },
  };
}

function errorMock() {
  return {
    request: { query: USER_LOGOUT },
    error: new Error('network down'),
  };
}

function renderMenu(
  mocks: ReturnType<typeof logoutMock | typeof errorMock>[],
  side?: 'top' | 'right' | 'bottom' | 'left',
) {
  return render(
    <MockedProvider mocks={mocks}>
      <UserMenu email="ana@example.com" side={side}>
        <button type="button">Account</button>
      </UserMenu>
    </MockedProvider>,
  );
}

function openMenu() {
  fireEvent.keyDown(screen.getByRole('button', { name: 'Account' }), {
    key: 'Enter',
  });
}

describe('UserMenu', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('renders the custom trigger it is given', () => {
    renderMenu([]);

    expect(screen.getByRole('button', { name: 'Account' })).toBeDefined();
  });

  it('shows the email and a Log out item when opened', () => {
    renderMenu([]);
    openMenu();

    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeDefined();
  });

  it('opens upward when side is top', () => {
    renderMenu([], 'top');
    openMenu();

    expect(screen.getByRole('menu').getAttribute('data-side')).toBe('top');
  });

  it('redirects to /signin when logout succeeds', async () => {
    renderMenu([logoutMock(true)]);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/signin'));
  });

  it('does not redirect when logout returns success false', async () => {
    renderMenu([logoutMock(false)]);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(replace).not.toHaveBeenCalled();
  });

  it('logs and does not redirect when the logout request fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    renderMenu([errorMock()]);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
