import type Dataloader from 'dataloader';
import jwt from 'jsonwebtoken';
import type { NextApiRequest } from 'next';
import { createConfig } from './config';
import { connect } from './database';
import type { IGlobalCache } from './types';

const globalCache: IGlobalCache = {
  knex: undefined,
};

export async function createContextInner() {
  const destroyers: (() => Promise<unknown>)[] = [];

  const { knex, cleanup: knexCleanup } = connect({ globalCache });

  destroyers.push(knexCleanup);

  async function cleanup() {
    return Promise.all(destroyers.map((destroy) => destroy()));
  }

  const config = createConfig();

  return {
    config,

    services: {
      knex: knex,
    },

    dl: new Map<symbol, Dataloader<unknown, unknown>>(),

    cleanup,
  };
}

export async function createContext(req: NextApiRequest): Promise<
  {
    req: NextApiRequest;
    user: { id: string; shouldRefreshSession: boolean } | null;
  } & Awaited<ReturnType<typeof createContextInner>>
> {
  const innerContext = await createContextInner();

  const { getSession, shouldRefreshSession } = await import('./session');
  const session = await getSession();

  const sessionPayload =
    session?.value != null
      ? jwt.verify(session.value, innerContext.config.JWT_SECRET)
      : null;

  const user =
    typeof sessionPayload?.sub === 'string'
      ? {
          id: sessionPayload.sub,
          shouldRefreshSession:
            typeof sessionPayload !== 'string' && sessionPayload.iat != null
              ? shouldRefreshSession(sessionPayload.iat)
              : false,
        }
      : null;

  return {
    req,

    ...innerContext,

    user,
  };
}
