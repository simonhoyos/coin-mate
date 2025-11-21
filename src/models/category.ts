import { omitBy } from 'lodash';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';
import type { Space } from './space';
import { User } from './user';

export class Category {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  name!: string;
  description?: string | undefined;

  user_id!: string;

  archived_at?: Date | string | null;

  static async gen(args: { context: IContext; id: string }) {
    const record = await getCategoryById({
      context: args.context,
      id: args.id,
    });

    return record?.user_id != null && record.user_id === args.context.user?.id
      ? record
      : null;
  }

  static async create(args: {
    context: IContext;
    data: z.infer<typeof CategoryCreateSchema>;
  }) {
    CategoryCreateSchema.parse(args.data);

    const userId = assertNotNull(
      args.context.user?.id,
      'User must be authenticated to create a category',
    );

    await User.gen({
      context: args.context,
      id: userId,
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const space = await trx<Space>('space')
          .select('space.id')
          .where({
            user_id: userId,
          })
          .limit(1)
          .first();

        const payload = {
          name: args.data.name.toLowerCase(),
          description: args.data.description,
          user_id: userId,
          space_id: assertNotNull(space?.id, 'Space not found for the user'),
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

  static async update(args: {
    context: IContext;
    data: z.infer<typeof CategoryUpdateSchema>;
  }) {
    CategoryUpdateSchema.parse(args.data);

    await User.gen({
      context: args.context,
      id: assertNotNull(
        args.context.user?.id,
        'User must be authenticated to update a category',
      ),
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    await Category.gen({
      context: args.context,
      id: args.data.id,
    }).then((category) => {
      if (category == null) {
        throw new Error('Category not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = omitBy(
          {
            name: args.data.name,
            description: args.data.description,
          },
          (value) => (value ?? '') === '',
        );

        const [category] = await trx<Category>('category')
          .update(payload, '*')
          .where({
            id: args.data.id,
          });

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'category',
            object_id: assertNotNull(
              category?.id,
              'Category could not be updated',
            ),
            operation: 'update',
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

  static async delete(args: {
    context: IContext;
    data: z.infer<typeof CategoryDeleteSchema>;
  }) {
    CategoryDeleteSchema.parse(args.data);

    await User.gen({
      context: args.context,
      id: assertNotNull(
        args.context.user?.id,
        'User must be authenticated to delete a category',
      ),
    }).then((user) => {
      if (user == null) {
        throw new Error('User not found');
      }
    });

    await Category.gen({
      context: args.context,
      id: args.data.id,
    }).then((category) => {
      if (category == null) {
        throw new Error('Category not found');
      }
    });

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          archived_at: new Date(),
        };

        const [category] = await trx<Category>('category')
          .update(payload, '*')
          .where({
            id: args.data.id,
          });

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'category',
            object_id: assertNotNull(
              category?.id,
              'Category could not be deleted',
            ),
            operation: 'delete',
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

const CategoryUpdateSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(32).optional(),
  description: z.string().max(256).optional(),
});

const CategoryDeleteSchema = z.object({
  id: z.uuid(),
});

const getCategoryById = createLoader(
  async (args: { context: IContext; keys: readonly string[] }) => {
    const categories = (await args.context.services
      .knex<Category>('category')
      .select([
        'category.id',
        'category.name',
        'category.description',
        'category.user_id',
      ])
      .whereIn('category.id', args.keys)
      .whereNull('category.archived_at')) as unknown as Pick<
      Category,
      'id' | 'name' | 'description' | 'user_id'
    >[];

    return args.keys.map((key) => {
      const category = categories.find((category) => category.id === key);

      return category != null
        ? {
            ...category,
            getReport: () =>
              getReportByCategoryId({
                context: args.context,
                id: category.id,
              }),
          }
        : null;
    });
  },
);

const getReportByCategoryId = createLoader(
  async (args: { context: IContext; keys: readonly string[] }) => {
    const reports = (await args.context.services
      .knex<Category>('category')
      .select([
        'category.id as categoryId',
        args.context.services.knex.raw(
          `count(transaction_ledger.id) as "totalCount"`,
        ),
        args.context.services.knex.raw(
          `sum(transaction_ledger.amount_cents) as "totalAmountCents"`,
        ),
        args.context.services.knex.raw(
          `avg(transaction_ledger.amount_cents) as "averageAmountCents"`,
        ),
      ])
      .leftJoin(
        'transaction_ledger',
        'transaction_ledger.category_id',
        'category.id',
      )
      .where('transaction_ledger.type', 'expense')
      .where(
        'transaction_ledger.transacted_at',
        '>=',
        args.context.services.knex.raw(`date_trunc('month', now())`),
      )
      .whereIn('category.id', args.keys)
      .groupBy('category.id')) as unknown as {
      categoryId: string;
      totalCount?: number;
      totalAmountCents?: number;
      averageAmountCents?: number;
    }[];

    return args.keys.map(
      (key) => reports?.find((report) => report.categoryId === key) || null,
    );
  },
);
