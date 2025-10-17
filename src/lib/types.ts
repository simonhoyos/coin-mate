import type Dataloader from 'dataloader';
import type { Knex } from 'knex';
import type { NextApiRequest } from 'next';
import type { IConfig } from './config';

export interface IContext {
  req: NextApiRequest;

  config: IConfig;

  services: {
    knex: Knex;
  };

  user?: {
    id: string;
  }

  metadata?: Record<string, unknown>;

  dl: Map<symbol, Dataloader<unknown, unknown>>;

  cleanup: () => Promise<unknown[]>;
}

export type IGlobalCache = {
  knex: Knex | undefined;
};
