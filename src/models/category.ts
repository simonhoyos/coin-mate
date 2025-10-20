import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';

export class Category {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  name!: string;
  description?: string | undefined;

  user_id!: string;

  archived_at?: Date | string | null;

  static async create(args: {
    context: IContext;
    data: z.infer<typeof CategoryCreateSchema>;
  }) {
    CategoryCreateSchema.parse(args.data);

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          name: args.data.name,
          description: args.data.description,
          user_id: assertNotNull(
            args.context.user?.id,
            'User must be authenticated to create a category',
          ),
        };

        const [category] = await trx<Category>('category').insert(payload, '*');

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'category',
            object_id: assertNotNull(
              category?.id,
              'Category could not be created',
            ),
            operation: 'create',
            payload,
          },
        });

        return {
          category,
        };
      },
    );

    return {
      category: trxResult.category,
    };
  }
}

const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(32),
  description: z.string().max(256).optional(),
});
