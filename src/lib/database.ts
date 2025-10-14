import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from '@/models';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgres://root@localhost:26257/defaultdb?sslmode=disable',
    max: 5,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
