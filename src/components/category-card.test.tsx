import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryCard } from './category-card';

const mobileState = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mobileState.isMobile,
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({
        children,
        onClick,
        drag,
        dragConstraints: _dragConstraints,
        dragElastic: _dragElastic,
        animate: _animate,
        onPanEnd: _onPanEnd,
        ...props
      }: React.ComponentProps<'button'> & {
        drag?: boolean | string;
        dragConstraints?: unknown;
        dragElastic?: unknown;
        animate?: unknown;
        onPanEnd?: unknown;
      }) => (
        <button onClick={onClick} data-drag={String(drag)} {...props}>
          {children}
        </button>
      ),
    },
    useAnimation: () => ({
      start: vi.fn(),
    }),
  };
});

describe('CategoryCard', () => {
  const category = {
    id: 'c1',
    name: 'groceries',
    description: 'Food and supplies',
    space: { id: 's1', name: 'Personal' },
  };
  const onEditClick = vi.fn();
  const onDeleteClick = vi.fn();

  const renderCard = () =>
    render(
      <CategoryCard
        category={category}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />,
    );

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mobileState.isMobile = false;
  });

  it('renders the name, description, and space name', () => {
    renderCard();
    expect(screen.getByText('groceries')).toBeDefined();
    expect(screen.getByText('Food and supplies')).toBeDefined();
    expect(screen.getByText('Personal')).toBeDefined();
  });

  describe('on desktop', () => {
    it('renders exactly one Edit and one Delete button', () => {
      renderCard();
      expect(screen.getAllByRole('button', { name: /^edit$/i })).toHaveLength(
        1,
      );
      expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(
        1,
      );
    });

    it('calls onEditClick with the category id and nothing else', () => {
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
      expect(onEditClick).toHaveBeenCalledWith('c1');
      expect(onDeleteClick).not.toHaveBeenCalled();
    });

    it('calls onDeleteClick with the category id and nothing else', () => {
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
      expect(onDeleteClick).toHaveBeenCalledWith('c1');
      expect(onEditClick).not.toHaveBeenCalled();
    });

    it('disables drag on the card body', () => {
      renderCard();
      expect(
        screen.getByRole('button', { name: /groceries/i }).dataset.drag,
      ).toBe('false');
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      mobileState.isMobile = true;
    });

    it('keeps drag on the x axis', () => {
      renderCard();
      expect(
        screen.getByRole('button', { name: /groceries/i }).dataset.drag,
      ).toBe('x');
    });

    it('renders one Edit and one Delete button wired to the callbacks', () => {
      renderCard();
      const edit = screen.getAllByRole('button', { name: /^edit$/i });
      const del = screen.getAllByRole('button', { name: /^delete$/i });
      expect(edit).toHaveLength(1);
      expect(del).toHaveLength(1);
      fireEvent.click(edit[0] as HTMLElement);
      fireEvent.click(del[0] as HTMLElement);
      expect(onEditClick).toHaveBeenCalledWith('c1');
      expect(onDeleteClick).toHaveBeenCalledWith('c1');
    });
  });
});
