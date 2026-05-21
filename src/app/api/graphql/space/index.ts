import { compact } from 'lodash';
import type { IContext } from '@/lib/types';
import { Space } from '@/models/space';

export const typeDefs = `#graphql
  type Space {
    id: UUID!

    name: String
  }

  type SpaceConnection {
    edges: [Space]
  }

  extend type Query {
    userSpaces: SpaceConnection
  }
`;

export const resolvers = {
  Space: {
    name: (parent: { id: string }, _args: never, context: IContext) =>
      Space.gen({ context, id: parent.id }).then((space) => space?.name),
  },

  Query: {
    async userSpaces(_parent: never, _args: never, context: IContext) {
      if (context.user == null) {
        throw new Error('Unauthorized');
      }

      const rows = await context.services
        .knex('space_user')
        .join('space', 'space.id', 'space_user.space_id')
        .select('space.id')
        .where({ 'space_user.user_id': context.user.id })
        .whereNull('space_user.archived_at')
        .whereNull('space.archived_at');

      return {
        edges: compact(
          await Promise.all(
            rows.map((row: { id: string }) =>
              Space.gen({ context, id: row.id }).then((space) =>
                space != null ? { id: space.id } : null,
              ),
            ),
          ),
        ),
      };
    },
  },
};
