import type Dataloader from 'dataloader';
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
