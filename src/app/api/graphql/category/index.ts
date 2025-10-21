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

  extend type Mutation {
    categoryCreate(input: CategoryCreateInput!): Category
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
  },
};
