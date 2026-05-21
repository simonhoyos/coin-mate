import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { TransactionCard } from './transaction-card';

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
        ...props
      }: React.ComponentProps<'button'>) => (
        <button onClick={onClick} {...props}>
          {children}
        </button>
      ),
      p: ({ children, ...props }: React.ComponentProps<'p'>) => (
        <p {...props}>{children}</p>
      ),
    },
    useAnimation: () => ({
      start: vi.fn(),
    }),
  };
});

describe('TransactionCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
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
});
