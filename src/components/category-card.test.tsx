import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryCard } from './category-card';

const mobileState = vi.hoisted(() => ({ isMobile: false }));
const motionState = vi.hoisted(() => ({
  start: vi.fn(),
  onPanEnd: undefined as
    | undefined
    | ((e: unknown, info: unknown) => Promise<void>),
}));

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
        onPanEnd,
        ...props
      }: React.ComponentProps<'button'> & {
        drag?: boolean | string;
        dragConstraints?: unknown;
        dragElastic?: unknown;
        animate?: unknown;
        onPanEnd?: (e: unknown, info: unknown) => Promise<void>;
      }) => {
        motionState.onPanEnd = onPanEnd;
        return (
          <button onClick={onClick} data-drag={String(drag)} {...props}>
            {children}
          </button>
        );
      },
    },
    useAnimation: () => ({
      start: motionState.start,
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
    motionState.onPanEnd = undefined;
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

    it('does not attach a pan handler', () => {
      renderCard();
      expect(motionState.onPanEnd).toBeUndefined();
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

    const swipeOpen = async () => {
      await act(async () => {
        await motionState.onPanEnd?.(null, {
          offset: { x: -120 },
          velocity: { x: 0 },
        });
      });
    };

    it('opens the swipe actions when panned past the threshold', async () => {
      renderCard();
      await swipeOpen();
      expect(motionState.start).toHaveBeenCalledWith({ x: -160 });
    });

    it('snaps back when panned less than the threshold', async () => {
      renderCard();
      await act(async () => {
        await motionState.onPanEnd?.(null, {
          offset: { x: -20 },
          velocity: { x: 0 },
        });
      });
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
      expect(motionState.start).not.toHaveBeenCalledWith({ x: -160 });
    });

    it('closes an open swipe on tap', async () => {
      renderCard();
      await swipeOpen();
      motionState.start.mockClear();
      fireEvent.click(screen.getByRole('button', { name: /groceries/i }));
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
    });

    it('resets an open swipe when the viewport becomes desktop', async () => {
      const view = renderCard();
      await swipeOpen();
      motionState.start.mockClear();
      mobileState.isMobile = false;
      view.rerender(
        <CategoryCard
          category={category}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />,
      );
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
    });
  });
});
