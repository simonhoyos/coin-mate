import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TransactionCard } from './transaction-card';
import React from 'react';

// Mocking Link since it requires a Router context
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

// Mock framer-motion to simplify testing gestures if needed, 
// but we can also test the initial states
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, onClick, ...props }: any) => (
        <div onClick={onClick} {...props}>{children}</div>
      ),
      p: ({ children, ...props }: any) => (
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
      />
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
      />
    );

    const concept = screen.getByText('Test Concept');
    fireEvent.click(concept.parentElement?.parentElement!); // Click the motion.div

    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('hides description when clicked again', async () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />
    );

    const concept = screen.getByText('Test Concept');
    const card = concept.parentElement?.parentElement!;
    
    fireEvent.click(card); // Expand
    expect(screen.getByText('Test Description')).toBeDefined();

    fireEvent.click(card); // Collapse
    expect(screen.queryByText('Test Description')).toBeNull();
  });

  it('triggers delete when the delete button is clicked', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        moneyFormatter={mockMoneyFormatter}
        editHref="/edit"
        onDeleteClick={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
