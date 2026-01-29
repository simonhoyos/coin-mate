import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { Category } from '@/models/category';

export const typeDefs = `#graphql
  type Category {
    id: UUID!

    name: String
    description: String

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
    categoryList: CategoryConnection
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
    async categoryList(_parent: never, _args: never, context: IContext) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const categories = await context.services
        .knex<Category>('category')
        .where({
          user_id: context.user.id,
          archived_at: null,
        })
        .orderBy('name', 'asc');

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
  },

  Mutation: {
    async categoryCreate(
      _parent: never,
      args: { input: { name: string; description?: string } },
      context: IContext,
    ) {
      const { name, description } = args.input;

      const createResult = await Category.create({
        context,
        data: {
          name,
          description,
        },
      });

      return {
        id: createResult.category?.id,
      };
    },

    async categoryUpdate(
      _parent: never,
      args: { input: { id: string; name?: string; description?: string } },
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
