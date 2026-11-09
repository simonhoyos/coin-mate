import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme }),
}));

function openMenu() {
  const trigger = screen.getByRole('button', { name: /toggle theme/i });
  fireEvent.keyDown(trigger, { key: 'Enter' });
}

describe('ThemeToggle', () => {
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

  it('renders an accessible toggle button', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeDefined();
  });

  it('shows Light, Dark and System options when opened', () => {
    render(<ThemeToggle />);
    openMenu();

    const labels = screen
      .getAllByRole('menuitem')
      .map((item) => item.textContent);
    expect(labels).toEqual(['Light', 'Dark', 'System']);
  });

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark'],
    ['System', 'system'],
  ])('calls setTheme with the chosen value: %s', (label, value) => {
    render(<ThemeToggle />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: label }));

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith(value);
  });
});
