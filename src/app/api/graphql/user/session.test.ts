import knex from 'knex';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertNotNull } from '@/lib/assert.js';
import { clearSession, createSession } from '@/lib/session';
import { createTestContext } from '@/lib/testing/context';
import { createUser } from '@/lib/testing/factories/user';
import knexConfig from '../../../../../knexfile.js';
import { resolvers } from '.';

const testKnex = knex(knexConfig);

vi.mock('@/lib/session', async () => {
  const actual = await vi.importActual('@/lib/session');
  return {
    ...actual,
    createSession: vi.fn(),
    clearSession: vi.fn(),
  };
});

describe('User session sliding window (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes the session if shouldRefreshSession is true', async () => {
    const context = await createTestContext();
    const user = await createUser(testKnex);

    // Simulate a context where the session should be refreshed
    const testContext = {
      ...context.login(user),
      user: {
        id: assertNotNull(user).id,
        shouldRefreshSession: true,
      },
    };

    await resolvers.Query.me(null as never, {} as never, testContext);

    expect(createSession).toHaveBeenCalled();
  });

  it('does NOT refresh the session if shouldRefreshSession is false', async () => {
    const context = await createTestContext();
    const user = await createUser(testKnex);

    // Simulate a context where the session is fresh
    const testContext = {
      ...context.login(user),
      user: {
        id: assertNotNull(user).id,
        shouldRefreshSession: false,
      },
    };

    await resolvers.Query.me(null as never, {} as never, testContext);

    expect(createSession).not.toHaveBeenCalled();
  });

  it('does NOT refresh the session if user is not logged in', async () => {
    const context = await createTestContext();

    const testContext = {
      ...context,
      user: null,
    };

    await expect(
      resolvers.Query.me(null as never, {} as never, testContext),
    ).rejects.toThrow('Unauthorized');

    expect(createSession).not.toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalled();
  });
});
