import { assertNotNull } from '@/lib/assert';
import { createSession } from '@/lib/session';
import type { IContext } from '@/lib/types';
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

  extend type Mutation {
    userSignUp(input: UserSignUpInput!): UserPayload
    userSignIn(input: UserSignInInput!): UserPayload
  }
`;

export const resolvers = {
  User: {
    email: (parent: { id: string }, _args: never, context: IContext) =>
      User.gen({ context, id: parent.id }).then((user) => user.email),
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

      const signUpResult = await User.signUp({
        context,
        data: {
          email,
          password,
          confirmPassword,
        },
      });

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

      return {
        user: { id: signInResult.user?.id },
        token: signInResult.token,
      };
    },
  },
};
