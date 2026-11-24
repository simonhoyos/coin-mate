import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { TransactionCard } from './transaction-card';

const mobileState = vi.hoisted(() => ({
  isMobile: false as boolean | undefined,
}));
const motionState = vi.hoisted(() => ({
  start: vi.fn(),
  onPanEnd: undefined as
    | undefined
    | ((e: unknown, info: unknown) => Promise<void>),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => mobileState.isMobile,
}));

vi.mock('next/link', () => {
  return {
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => <a href={href}>{children}</a>,
  };
});

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
      p: ({ children, ...props }: React.ComponentProps<'p'>) => (
        <p {...props}>{children}</p>
      ),
    },
    useAnimation: () => ({
      start: motionState.start,
    }),
  };
});

describe('TransactionCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mobileState.isMobile = false;
    motionState.onPanEnd = undefined;
  });

  const mockTransaction = {
    id: '1',
    concept: 'Test Concept',
    description: 'Test Description',
    amount_cents: 1000,
    type: 'expense',
    category: { id: 'cat1', name: 'Food' },
    space: { id: 'space1', name: 'Personal' },
  };

  const mockMoneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'COP',
  });

  const mockOnDelete = vi.fn();

  const card = () => (
    <TransactionCard
      transaction={mockTransaction}
      moneyFormatter={mockMoneyFormatter}
      editHref="/edit"
      onDeleteClick={mockOnDelete}
    />
  );

  const renderCard = () => render(card());

  it('renders correctly and hides description by default', () => {
    renderCard();

    expect(screen.getByText('Test Concept')).toBeDefined();
    expect(screen.queryByText('Test Description')).toBeNull();
  });

  it('shows description when clicked', async () => {
    renderCard();

    const parentElement = assertNotNull(
      screen.getByText('Test Concept').parentElement?.parentElement,
    );
    fireEvent.click(parentElement);

    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('hides description when clicked again', async () => {
    renderCard();

    const concept = screen.getByText('Test Concept');
    const card = assertNotNull(concept.parentElement?.parentElement);

    fireEvent.click(card);
    expect(screen.getByText('Test Description')).toBeDefined();

    fireEvent.click(card);
    expect(screen.queryByText('Test Description')).toBeNull();
  });

  it('triggers delete when the delete button is clicked', () => {
    renderCard();

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  describe('on desktop', () => {
    it('renders one Edit link and one Delete button that calls onDeleteClick', () => {
      renderCard();

      const edit = screen.getAllByRole('link', { name: /edit/i });
      const del = screen.getAllByRole('button', { name: /delete/i });
      expect(edit).toHaveLength(1);
      expect(assertNotNull(edit[0]).getAttribute('href')).toBe('/edit');
      expect(del).toHaveLength(1);

      fireEvent.click(assertNotNull(del[0]));
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('disables drag on the card body', () => {
      renderCard();

      const body = assertNotNull(
        screen.getByText('Test Concept').closest('[data-drag]'),
      );
      expect(body.getAttribute('data-drag')).toBe('false');
    });

    it('does not toggle the description when an action is clicked', () => {
      renderCard();

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      fireEvent.click(screen.getByRole('link', { name: /edit/i }));

      expect(screen.queryByText('Test Description')).toBeNull();
    });

    it('does not attach a pan handler', () => {
      renderCard();
      expect(motionState.onPanEnd).toBeUndefined();
    });
  });

  describe('before the viewport is measured', () => {
    it('renders no action set and no drag', () => {
      mobileState.isMobile = undefined;
      renderCard();
      expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
      expect(screen.queryByRole('link', { name: /edit/i })).toBeNull();
      expect(motionState.onPanEnd).toBeUndefined();
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      mobileState.isMobile = true;
    });

    it('keeps drag on x with one Edit link and one working Delete button', () => {
      renderCard();

      const body = assertNotNull(
        screen.getByText('Test Concept').closest('[data-drag]'),
      );
      expect(body.getAttribute('data-drag')).toBe('x');

      const edit = screen.getAllByRole('link', { name: /edit/i });
      expect(edit).toHaveLength(1);
      expect(assertNotNull(edit[0]).getAttribute('href')).toBe('/edit');

      const del = screen.getAllByRole('button', { name: /delete/i });
      expect(del).toHaveLength(1);
      fireEvent.click(assertNotNull(del[0]));
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('toggles the description when the card body is clicked', () => {
      renderCard();

      const body = assertNotNull(
        screen.getByText('Test Concept').closest('[data-drag]'),
      );
      fireEvent.click(body);
      expect(screen.getByText('Test Description')).toBeDefined();
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

    it('closes an open swipe on tap without expanding the description', async () => {
      renderCard();
      await swipeOpen();
      motionState.start.mockClear();
      fireEvent.click(
        assertNotNull(screen.getByText('Test Concept').closest('[data-drag]')),
      );
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
      expect(screen.queryByText('Test Description')).toBeNull();
    });

    it('resets an open swipe when the viewport becomes desktop', async () => {
      const view = renderCard();
      await swipeOpen();
      motionState.start.mockClear();
      mobileState.isMobile = false;
      view.rerender(card());
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
    });
  });

  describe('category icon', () => {
    const renderWith = (transaction: Record<string, unknown>) =>
      render(
        <TransactionCard
          transaction={{ ...mockTransaction, ...transaction }}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
    const circleOf = (container: HTMLElement) =>
      container.querySelectorAll<HTMLElement>('[data-slot="category-icon"]');

    it('shows the category icon on the category color', () => {
      const { container } = renderWith({
        category: {
          id: 'cat1',
          name: 'Food',
          icon: 'shopping-cart',
          color: '#ef4444',
        },
      });
      const circles = circleOf(container);
      expect(circles).toHaveLength(1);
      const circle = assertNotNull(circles[0]);
      expect(circle.querySelector('svg.tabler-icon-shopping-cart')).not.toBe(
        null,
      );
      expect(circle.style.backgroundColor).toBe('rgb(239, 68, 68)');
    });

    it('shows the generic icon on grey when the category has no icon or color', () => {
      const { container } = renderWith({
        category: { id: 'cat1', name: 'Food', icon: null, color: null },
      });
      const circle = assertNotNull(circleOf(container)[0]);
      expect(circle.querySelector('svg.tabler-icon-category')).not.toBe(null);
      expect(circle.style.backgroundColor).toBe('rgb(107, 114, 128)');
    });

    it('shows the default circle when the transaction has no category', () => {
      const { container } = renderWith({ category: undefined });
      const circles = circleOf(container);
      expect(circles).toHaveLength(1);
      const circle = assertNotNull(circles[0]);
      expect(circle.querySelector('svg.tabler-icon-category')).not.toBe(null);
      expect(circle.style.backgroundColor).toBe('rgb(107, 114, 128)');
    });

    it('places the circle before the content, inside the drag body', () => {
      const { container } = renderWith({});
      const circle = assertNotNull(circleOf(container)[0]);
      const concept = screen.getByText('Test Concept');
      expect(circle.closest('[data-drag]')).toBe(
        concept.closest('[data-drag]'),
      );
      expect(
        circle.compareDocumentPosition(concept) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});
