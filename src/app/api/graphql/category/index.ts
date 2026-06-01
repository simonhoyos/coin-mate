import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { Category } from '@/models/category';
import { Space } from '@/models/space';

export const typeDefs = `#graphql
  type Category {
    id: UUID!

    name: String
    description: String

    space: Space

    report(month: Int, year: Int): CategoryReport
  }

  type CategoryConnection {
    edges: [Category]
  }

  type CategoryReport {
    categoryId: UUID!

    totalCount: Int

    totalAmountCents: Int
    averageAmountCents: Float
  }

  input CategoryCreateInput {
    name: String!
    description: String
    space_id: UUID!
  }

  input CategoryUpdateInput {
    id: UUID!
    name: String
    description: String
  }

  input CategoryDeleteInput {
    id: UUID!
  }

  extend type Query {
    categoryList(space_id: UUID): CategoryConnection
    allCategoriesList: CategoryConnection
  }

  extend type Mutation {
    categoryCreate(input: CategoryCreateInput!): Category
    categoryUpdate(input: CategoryUpdateInput!): Category
    categoryDelete(input: CategoryDeleteInput!): Category
  }
`;

export const resolvers = {
  Category: {
    name: (parent: { id: string }, _args: never, context: IContext) =>
      Category.gen({ context, id: parent.id }).then(
        (category) => category?.name,
      ),

    description: (parent: { id: string }, _args: never, context: IContext) =>
      Category.gen({ context, id: parent.id }).then(
        (category) => category?.description,
      ),

    space: (parent: { id: string }, _args: never, context: IContext) =>
      Category.gen({ context, id: parent.id }).then((category) =>
        category?.space_id != null
          ? Space.gen({ context, id: category.space_id }).then((space) =>
              space != null ? { id: space.id } : null,
            )
          : null,
      ),

    report: async (
      parent: { id: string },
      args: { month?: number | undefined; year?: number | undefined },
      context: IContext,
    ) =>
      Category.gen({ context, id: parent.id }).then((category) =>
        category?.getReport({
          month: args.month,
          year: args.year,
        }),
      ),
  },

  Query: {
    async categoryList(
      _parent: never,
      args: { space_id?: string },
      context: IContext,
    ) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const query = context.services.knex<Category>('category').where({
        user_id: context.user.id,
        archived_at: null,
      });

      if (args.space_id != null) {
        query.where({ space_id: args.space_id });
      }

      const categories = await query.orderBy('name', 'asc');

      return {
        edges: compact(
          await Promise.all(
            categories.map((category) =>
              Category.gen({
                context,
                id: category.id,
              }).then((category) =>
                category != null ? { id: category.id } : null,
              ),
            ),
          ),
        ),
      };
    },

    async allCategoriesList(_parent: never, _args: never, context: IContext) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const rows = await context.services
        .knex<Category>('category')
        .join('space_user', 'space_user.space_id', 'category.space_id')
        .select('category.id')
        .where({ 'space_user.user_id': context.user.id })
        .whereNull('space_user.archived_at')
        .whereNull('category.archived_at')
        .orderBy('category.name', 'asc');

      return {
        edges: compact(
          await Promise.all(
            rows.map((row: { id: string }) =>
              Category.gen({ context, id: row.id }).then((category) =>
                category != null ? { id: category.id } : null,
              ),
            ),
          ),
        ),
      };
    },
  },

  Mutation: {
    async categoryCreate(
      _parent: never,
      args: { input: { name: string; description?: string; space_id: string } },
      context: IContext,
    ) {
      const { name, description, space_id } = args.input;

      const createResult = await Category.create({
        context,
        data: {
          name,
          description,
          space_id,
        },
      });

      return {
        id: createResult.category?.id,
      };
    },

    async categoryUpdate(
      _parent: never,
      args: { input: { id: string; name: string; description?: string } },
      context: IContext,
    ) {
      const { id, name, description } = args.input;

      const updateResult = await Category.update({
        context,
        data: {
          id,
          name,
          description,
        },
      });

      return {
        id: updateResult.category?.id,
      };
    },

    async categoryDelete(
      _parent: never,
      args: { input: { id: string } },
      context: IContext,
    ) {
      const { id } = args.input;

      const deleteResult = await Category.delete({
        context,
        data: {
          id,
        },
      });

      return {
        id: deleteResult.category?.id,
      };
    },
  },
};
