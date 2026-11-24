import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubResizeObserver } from '@/test/resize-observer';
import CategoriesPage from './page';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobileResolved: () => false,
  useIsMobile: () => false,
}));

const SPACE_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = '22222222-2222-4222-8222-222222222222';

const spaceListMock = {
  request: {
    query: gql`
      query CategoriesPageSpaceListQuery {
        userSpaceList {
          edges {
            id
            name
          }
        }
      }
    `,
  },
  result: {
    data: {
      userSpaceList: {
        __typename: 'SpaceConnection',
        edges: [{ __typename: 'Space', id: SPACE_ID, name: 'Home' }],
      },
    },
  },
};

const allCategoriesQuery = gql`
  query AllCategoriesListQuery {
    allCategoriesList {
      edges {
        id

        name
        description
        icon
        color

        space {
          id
          name
        }
      }
    }
  }
`;

const categoryList = {
  data: {
    allCategoriesList: {
      __typename: 'CategoryConnection',
      edges: [
        {
          __typename: 'Category',
          id: CATEGORY_ID,
          name: 'Transport',
          description: 'Getting around',
          icon: 'car',
          color: '#3b82f6',
          space: { __typename: 'Space', id: SPACE_ID, name: 'Home' },
        },
      ],
    },
  },
};

const categoryListMocks = [
  { request: { query: allCategoriesQuery }, result: categoryList },
  { request: { query: allCategoriesQuery }, result: categoryList },
];

const createMutation = gql`
  mutation CategoryCreateMutation($input: CategoryCreateInput!) {
    categoryCreate(input: $input) {
      id
      name
      description
      icon
      color
    }
  }
`;

const updateMutation = gql`
  mutation CategoryUpdateMutation($input: CategoryUpdateInput!) {
    categoryUpdate(input: $input) {
      id
      name
      description
      icon
      color
    }
  }
`;

function renderPage(mutationMock: unknown) {
  render(
    <MockedProvider
      // biome-ignore lint/suspicious/noExplicitAny: mock shapes are loose
      mocks={[spaceListMock, ...categoryListMocks, mutationMock] as any}
    >
      <CategoriesPage />
    </MockedProvider>,
  );
}

function pressed(group: HTMLElement) {
  return within(group)
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.getAttribute('aria-label'));
}

async function openCreateDialog() {
  const trigger = await screen.findByRole('button', {
    name: 'Create category',
  });
  await screen.findByText('Transport');
  fireEvent.click(trigger);
  return screen.findByRole('dialog');
}

describe('CategoriesPage pickers', () => {
  beforeEach(() => {
    cleanup();
    stubResizeObserver();
  });

  it('sends the picked icon and color when creating', async () => {
    const result = vi.fn(() => ({
      data: {
        categoryCreate: {
          __typename: 'Category',
          id: 'new',
          name: 'Food',
          description: '',
          icon: 'shopping-cart',
          color: '#22c55e',
        },
      },
    }));
    renderPage({
      request: {
        query: createMutation,
        variables: {
          input: {
            name: 'Food',
            description: '',
            space_id: SPACE_ID,
            icon: 'shopping-cart',
            color: '#22c55e',
          },
        },
      },
      result,
    });

    const dialog = await openCreateDialog();
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Food' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'shopping cart' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Green' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create category' }),
    );

    await waitFor(() => expect(result).toHaveBeenCalled());
  });

  it('shows the generic icon and grey and sends null when nothing is picked', async () => {
    const result = vi.fn(() => ({
      data: {
        categoryCreate: {
          __typename: 'Category',
          id: 'new',
          name: 'Food',
          description: '',
          icon: null,
          color: null,
        },
      },
    }));
    renderPage({
      request: {
        query: createMutation,
        variables: {
          input: {
            name: 'Food',
            description: '',
            space_id: SPACE_ID,
            icon: null,
            color: null,
          },
        },
      },
      result,
    });

    const dialog = await openCreateDialog();

    expect(
      pressed(within(dialog).getByRole('group', { name: 'Icon' })),
    ).toEqual(['category']);
    expect(
      pressed(within(dialog).getByRole('group', { name: 'Color' })),
    ).toEqual(['Grey']);

    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Food' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create category' }),
    );

    await waitFor(() => expect(result).toHaveBeenCalled());
  });

  it('seeds the update dialog from the stored icon and color', async () => {
    renderPage({
      request: { query: updateMutation, variables: { input: {} } },
      result: { data: {} },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');

    expect(
      pressed(within(dialog).getByRole('group', { name: 'Icon' })),
    ).toEqual(['car']);
    expect(
      pressed(within(dialog).getByRole('group', { name: 'Color' })),
    ).toEqual(['Blue']);
  });

  it('sends the changed color and the kept icon when updating', async () => {
    const result = vi.fn(() => ({
      data: {
        categoryUpdate: {
          __typename: 'Category',
          id: CATEGORY_ID,
          name: 'Transport',
          description: 'Getting around',
          icon: 'car',
          color: '#ec4899',
        },
      },
    }));
    renderPage({
      request: {
        query: updateMutation,
        variables: {
          input: {
            id: CATEGORY_ID,
            name: 'Transport',
            description: 'Getting around',
            icon: 'car',
            color: '#ec4899',
          },
        },
      },
      result,
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Pink' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Update category' }),
    );

    await waitFor(() => expect(result).toHaveBeenCalled());
  });
});
