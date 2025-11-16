import type { Knex } from 'knex';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';

export class Space {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  name!: string;
  description?: string | undefined;

  user_id!: string;

  archived_at?: Date | string | null;

  static async create(args: {
    trx: Knex.Transaction;
    context: IContext;
    data: z.infer<typeof SpaceCreateSchema>;
  }) {
    const parsedData = SpaceCreateSchema.parse(args.data);

    const payload = {
      name: parsedData.name,
      description: parsedData.description,
      user_id: parsedData.userId,
    };

    const [space] = await args.trx<Space>('space').insert(payload, '*');

    await Audit.log({
      trx: args.trx,
      context: args.context,
      data: {
        object: 'space',
        object_id: assertNotNull(space?.id, 'Space could not be created'),
        operation: 'create',
        payload,
      },
    });

    return {
      space,
    };
  }
}

const SpaceCreateSchema = z.object({
  userId: z.uuid(),
  name: z.string().min(1).max(32),
  description: z.string().max(256).optional(),
});

export class SpaceUser {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  space_id!: string;
  user_id!: string;

  role!: string;

  archived_at?: Date | string | null;

  static async create(args: {
    trx: Knex.Transaction;
    context: IContext;
    data: z.infer<typeof SpaceUserCreateSchema>;
  }) {
    const parsedData = SpaceUserCreateSchema.parse(args.data);

    const payload = {
      space_id: parsedData.spaceId,
      user_id: parsedData.userId,
      role: parsedData.role,
    };

    const [spaceUser] = await args
      .trx<SpaceUser>('space_user')
      .insert(payload, '*');

    await Audit.log({
      trx: args.trx,
      context: args.context,
      data: {
        object: 'space_user',
        object_id: assertNotNull(
          spaceUser?.id,
          'SpaceUser could not be created',
        ),
        operation: 'create',
        payload,
      },
    });

    return {
      spaceUser,
    };
  }
}

const SpaceUserCreateSchema = z.object({
  spaceId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(['admin']),
});
