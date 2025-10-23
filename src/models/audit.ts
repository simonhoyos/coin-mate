import type { Knex } from 'knex';
import { z } from 'zod';
import type { IContext } from '@/lib/types';

const AuditLogSchema = z.object({
  object: z.enum(['user', 'category', 'transaction_ledger']),
  object_id: z.uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  payload: z.record(z.string(), z.unknown()),
});

export class Audit {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  user_id?: string | null;

  object!: string;
  object_id!: string;
  operation!: string;

  data!: { payload: Record<string, unknown> } & Record<string, unknown>;
  metadata!: Record<string, unknown>;

  static async log(args: {
    trx: Knex.Transaction;
    context: IContext;
    data: z.infer<typeof AuditLogSchema>;
  }) {
    AuditLogSchema.parse(args.data);

    const [audit] = await args.context.services.knex<Audit>('audit').insert(
      {
        user_id: args.context.user?.id ?? null,
        object: args.data.object,
        object_id: args.data.object_id,
        operation: args.data.operation,
        data: {
          payload: args.data.payload,
        },
        metadata: args.context.metadata ?? {},
      },
      '*',
    );

    return audit;
  }
}
