import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from './site-header';

const mobileState = vi.hoisted(() => ({
  isMobile: true as boolean | undefined,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => mobileState.isMobile,
  useIsMobile: () => !!mobileState.isMobile,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

function renderHeader() {
  return render(
    <SidebarProvider>
      <SiteHeader />
    </SidebarProvider>,
  );
}

describe('SiteHeader', () => {
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

  it('hides the sidebar trigger on mobile and keeps the theme toggle', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: 'Toggle Sidebar' })).toBeNull();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeDefined();
  });

  it('shows the sidebar trigger and the theme toggle on desktop', () => {
    mobileState.isMobile = false;
    renderHeader();

    expect(
      screen.getByRole('button', { name: 'Toggle Sidebar' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeDefined();
  });

  it('keeps the trigger CSS-hidden on mobile until the viewport is known', () => {
    mobileState.isMobile = undefined;
    renderHeader();

    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' });
    expect(trigger.className).toContain('hidden');
    expect(trigger.className).toContain('md:inline-flex');
  });
});
