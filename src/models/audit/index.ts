import type { Knex } from 'knex';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import type { IContext } from '@/lib/types';

const AuditLogSchema = z.object({
  object: z.enum([
    'user',
    'category',
    'transaction_ledger',
    'space',
    'space_user',
  ]),
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
    const parsedData = AuditLogSchema.parse(args.data);

    const audit = assertNotNull(
      (
        await args.context.services.knex<Audit>('audit').insert(
          {
            user_id: args.context.user?.id ?? null,
            object: parsedData.object,
            object_id: parsedData.object_id,
            operation: parsedData.operation,
            data: {
              payload: parsedData.payload,
            },
            metadata: args.context.metadata ?? {},
          },
          '*',
        )
      ).at(0),
      'Could not create audit log',
    );

    return audit;
  }
}
