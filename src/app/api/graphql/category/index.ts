import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { Category } from '@/models/category';

export const typeDefs = `#graphql
  type Category {
    id: UUID!

    name: String
    description: String
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

  type CategoryConnection {
    edges: [Category]
  }

  extend type Query {
    categoryList: CategoryConnection
  }

  extend type Mutation {
    categoryCreate(input: CategoryCreateInput!): Category
    categoryUpdate(input: CategoryUpdateInput!): Category
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
        });

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

      const createResult = await Category.update({
        context,
        data: {
          id,
          name,
          description,
        },
      });

      return {
        id: createResult.category?.id,
      };
    },
  },
};
