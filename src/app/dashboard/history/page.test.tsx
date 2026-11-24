import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubResizeObserver } from '@/test/resize-observer';
import HistoryPage from './page';

const queryState = vi.hoisted(() => ({
  documents: [] as string[],
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => false,
  useIsMobile: () => false,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/history',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
  useQuery: (document: { loc?: { source: { body: string } } }) => {
    const body = document.loc?.source.body ?? '';
    queryState.documents.push(body);

    if (body.includes('query TransactionListQuery')) {
      return {
        loading: false,
        refetch: vi.fn(),
        fetchMore: vi.fn(),
        data: {
          transactionLedgerList: {
            cursor: null,
            edges: [
              {
                id: 'tx-1',
                concept: 'Bus ticket',
                description: '',
                currency: 'COP',
                original_currency: 'COP',
                amount_cents: 250000,
                original_amount_cents: 250000,
                transacted_at: new Date('2026-11-20T12:00:00Z').toISOString(),
                type: 'expense',
                space_id: 'space-1',
                category: {
                  id: 'cat-1',
                  name: 'transport',
                  icon: 'car',
                  color: '#3b82f6',
                },
                space: { id: 'space-1', name: 'Home' },
              },
            ],
          },
        },
      };
    }

    return { loading: false, refetch: vi.fn(), data: undefined };
  },
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    cleanup();
    queryState.documents = [];
    stubResizeObserver();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('requests the category icon and color for each transaction', () => {
    render(<HistoryPage />);

    const body =
      queryState.documents.find((doc) =>
        doc.includes('query TransactionListQuery'),
      ) ?? '';
    const categoryBlock = body.slice(body.indexOf('category {'));

    expect(categoryBlock).toMatch(/\bicon\b/);
    expect(categoryBlock).toMatch(/\bcolor\b/);
  });

  it('shows the category icon and color on each transaction card', () => {
    const { container } = render(<HistoryPage />);

    const circle = container.querySelector<HTMLElement>(
      '[data-slot="category-icon"]',
    );

    expect(circle).not.toBeNull();
    expect(circle?.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(circle?.querySelector('svg.tabler-icon-car')).not.toBeNull();
  });
});
