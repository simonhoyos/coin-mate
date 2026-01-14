import type Dataloader from 'dataloader';
import type { Knex } from 'knex';
import type { NextApiRequest } from 'next';
import type { IConfig } from './config';

export interface IContextInner {
  config: IConfig;

  services: {
    knex: Knex;
  };

  user: {
    id: string;
  } | null;

  metadata?: Record<string, unknown>;

  dl: Map<symbol, Dataloader<unknown, unknown>>;

  cleanup: () => Promise<unknown[]>;
}

export interface IContext extends IContextInner {
  req: NextApiRequest;
}

export type IGlobalCache = {
  knex: Knex | undefined;
};
