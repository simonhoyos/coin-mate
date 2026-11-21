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

  it('renders correctly and hides description by default', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />,
    );

    expect(screen.getByText('Test Concept')).toBeDefined();
    expect(screen.queryByText('Test Description')).toBeNull();
  });

  it('shows description when clicked', async () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />,
    );

    const parentElement = assertNotNull(
      screen.getByText('Test Concept').parentElement?.parentElement,
    );
    fireEvent.click(parentElement);

    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('hides description when clicked again', async () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />,
    );

    const concept = screen.getByText('Test Concept');
    const card = assertNotNull(concept.parentElement?.parentElement);

    fireEvent.click(card);
    expect(screen.getByText('Test Description')).toBeDefined();

    fireEvent.click(card);
    expect(screen.queryByText('Test Description')).toBeNull();
  });

  it('triggers delete when the delete button is clicked', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  describe('on desktop', () => {
    it('renders one Edit link and one Delete button that calls onDeleteClick', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );

      const edit = screen.getAllByRole('link', { name: /edit/i });
      const del = screen.getAllByRole('button', { name: /delete/i });
      expect(edit).toHaveLength(1);
      expect(assertNotNull(edit[0]).getAttribute('href')).toBe('/edit');
      expect(del).toHaveLength(1);

      fireEvent.click(assertNotNull(del[0]));
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('disables drag on the card body', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );

      const body = assertNotNull(
        screen.getByText('Test Concept').closest('[data-drag]'),
      );
      expect(body.getAttribute('data-drag')).toBe('false');
    });

    it('does not toggle the description when an action is clicked', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      fireEvent.click(screen.getByRole('link', { name: /edit/i }));

      expect(screen.queryByText('Test Description')).toBeNull();
    });

    it('does not attach a pan handler', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
      expect(motionState.onPanEnd).toBeUndefined();
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      mobileState.isMobile = true;
    });

    it('keeps drag on x with one Edit link and one working Delete button', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );

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
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );

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
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
      await swipeOpen();
      expect(motionState.start).toHaveBeenCalledWith({ x: -160 });
    });

    it('snaps back when panned less than the threshold', async () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
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
      render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
      await swipeOpen();
      motionState.start.mockClear();
      fireEvent.click(
        assertNotNull(screen.getByText('Test Concept').closest('[data-drag]')),
      );
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
      expect(screen.queryByText('Test Description')).toBeNull();
    });

    it('resets an open swipe when the viewport becomes desktop', async () => {
      const view = render(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
      await swipeOpen();
      motionState.start.mockClear();
      mobileState.isMobile = false;
      view.rerender(
        <TransactionCard
          transaction={mockTransaction}
          moneyFormatter={mockMoneyFormatter}
          editHref="/edit"
          onDeleteClick={mockOnDelete}
        />,
      );
      expect(motionState.start).toHaveBeenCalledWith({ x: 0 });
    });
  });
});
