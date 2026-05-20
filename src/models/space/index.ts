import type { Knex } from 'knex';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
import type { IContext } from '@/lib/types';
import { Audit } from '../audit';

export class Space {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  name!: string;
  description?: string | undefined;

  user_id!: string;

  archived_at?: Date | string | null;

  static async gen(args: { context: IContext; id: string }) {
    const record = await getSpaceById({
      context: args.context,
      id: args.id,
    });

    return record ?? null;
  }

  static async create(args: {
    trx: Knex.Transaction;
    context: IContext;
    data: z.infer<typeof SpaceCreateSchema>;
  }) {
    const parsedData = SpaceCreateSchema.parse(args.data);

    const payload = {
      user_id: parsedData.userId,
      name: parsedData.name,
      description: parsedData.description,
    };

    const space = assertNotNull(
      (await args.trx<Space>('space').insert(payload, '*')).at(0),
      'Space could not be created',
    );

    await Audit.log({
      trx: args.trx,
      context: args.context,
      data: {
        object: 'space',
        object_id: space.id,
        operation: 'create',
        payload: payload,
      },
    });

    await SpaceUser.create({
      trx: args.trx,
      context: args.context,
      data: {
        userId: parsedData.userId,
        spaceId: space.id,
        role: 'admin',
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

    const spaceUser = assertNotNull(
      (await args.trx<SpaceUser>('space_user').insert(payload, '*')).at(0),

      'SpaceUser could not be created',
    );

    await Audit.log({
      trx: args.trx,
      context: args.context,
      data: {
        object: 'space_user',
        object_id: spaceUser.id,
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

const getSpaceById = createLoader(
  async (args: { context: IContext; keys: readonly string[] }) => {
    const spaces = (await args.context.services
      .knex<Space>('space')
      .select(['space.id', 'space.name', 'space.description', 'space.created_at'])
      .whereIn('space.id', args.keys)
      .whereNull('space.archived_at')) as unknown as Pick<
      Space,
      'id' | 'name' | 'description' | 'created_at'
    >[];

    return args.keys.map((key) => spaces.find((space) => space.id === key) ?? null);
  },
);
