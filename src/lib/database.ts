import knexCreate from 'knex';

import knexConfig from '../../knexfile.js';
import type { IGlobalCache } from './types';

export function connect(opts: { globalCache: IGlobalCache }) {
  const { globalCache } = opts;

  const knex = globalCache.knex ?? knexCreate(knexConfig);

  if (globalCache.knex == null) {
    globalCache.knex = knex;
  }

  return {
    knex: globalCache.knex,

    async cleanup() {
      await knex.destroy();

      globalCache.knex = undefined;
    },
  };
}
