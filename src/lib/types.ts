import type { Knex } from 'knex';
import type { NextApiRequest } from 'next';
import type { IConfig } from './config';

export interface IContext {
  req: NextApiRequest;

  config: IConfig;

  services: {
    knex: Knex;
  };

  cleanup: () => Promise<unknown[]>;
}

export type IGlobalCache = {
  knex: Knex | undefined;
};
