import type Dataloader from 'dataloader';
import type { NextApiRequest } from 'next';
import type { User } from '@/models/user';
import { createContextInner } from '../context';
import type { IContext } from '../types';

export interface ITestContext extends IContext {
  login(user: User | undefined): IContext;
}

export async function createTestContext() {
  const innerContext = await createContextInner();

  const context = {
    ...innerContext,

    user: null,
    req: {} as NextApiRequest,
  };

  return {
    ...context,

    dl: new Map<symbol, Dataloader<unknown, unknown>>(),

    login(user: User | undefined) {
      return {
        ...context,
        ...(user?.id != null
          ? {
              user: {
                id: user?.id,
              },
            }
          : null),
      };
    },
  };
}
