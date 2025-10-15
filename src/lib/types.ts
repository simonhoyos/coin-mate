import type { Knex } from 'knex';
import type { IConfig } from './config';

export interface IContext {
  config: IConfig;

  services: {
    knex: Knex;
  };
}

export type IGlobalCache = {
  knex: Knex | undefined;
};
