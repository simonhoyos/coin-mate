import { GraphQLError } from 'graphql';
import { assertNotNull } from '@/lib/assert';
import { clearSession, createSession } from '@/lib/session';
import { createToken } from '@/lib/token';
import type { IContext } from '@/lib/types';
import { Space, SpaceUser } from '@/models/space';
import { User } from '@/models/user';

export const typeDefs = `#graphql
  type User {
    id: UUID!

    email: String
  }

  input UserSignUpInput {
    email: String!
    password: String!
    confirmPassword: String!
  }

  input UserSignInInput {
    email: String!
    password: String!
  }

  type UserPayload {
    user: User
    token: String
  }

  type UserLogoutPayload {
    success: Boolean!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    userSignUp(input: UserSignUpInput!): UserPayload
    userSignIn(input: UserSignInInput!): UserPayload
    userLogout: UserLogoutPayload
  }
`;

export const resolvers = {
  User: {
    email: (parent: { id: string }, _args: never, context: IContext) =>
      User.gen({ context, id: parent.id }).then((user) => user?.email),
  },

  Query: {
    async me(_parent: never, _args: never, context: IContext) {
      const userId = context.user?.id;

      if (userId == null) {
        await clearSession();

        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (context.user?.shouldRefreshSession === true) {
        const token = createToken(userId, context);
        await createSession(token);
      }

      return User.gen({ context, id: userId }).then((user) =>
        user?.id != null ? { id: user.id } : undefined,
      );
    },
  },

  Mutation: {
    async userSignUp(
      _parent: never,
      args: {
        input: { email: string; password: string; confirmPassword: string };
      },
      context: IContext,
    ) {
      const { email, password, confirmPassword } = args.input;

      const signUpResult = await context.services.knex.transaction(
        async (trx) => {
          const signUpResult = await User.signUp({
            trx,
            context,
            data: {
              email,
              password,
              confirmPassword,
            },
          });

          const spaceResult = await Space.create({
            trx,
            context,
            data: {
              userId: assertNotNull(
                signUpResult.user?.id,
                'User ID is null after sign up',
              ),
              name: 'Personal',
              description: 'Personal space',
            },
          });

          await SpaceUser.create({
            trx,
            context,
            data: {
              userId: assertNotNull(
                signUpResult.user?.id,
                'User ID is null after sign up',
              ),
              spaceId: assertNotNull(
                spaceResult.space?.id,
                'Space ID is null after space creation',
              ),
              role: 'admin',
            },
          });

          return signUpResult;
        },
      );

      await createSession(
        assertNotNull(signUpResult.token, 'User created without token'),
      );

      return {
        user: { id: signUpResult.user?.id },
        token: signUpResult.token,
      };
    },

    async userSignIn(
      _parent: never,
      args: {
        input: { email: string; password: string };
      },
      context: IContext,
    ) {
      const { email, password } = args.input;

      const signInResult = await User.signIn({
        context,
        data: {
          email,
          password,
        },
      });

      await createSession(
        assertNotNull(signInResult.token, 'User created without token'),
      );

      return {
        user: { id: signInResult.user?.id },
        token: signInResult.token,
      };
    },

    async userLogout() {
      await clearSession();

      return {
        success: true,
      };
    },
  },
};
