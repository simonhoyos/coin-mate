import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
import type { IContext } from '@/lib/types';
import { Audit } from './audit';

export class User {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  email!: string;
  password!: string;

  static async gen(args: { context: IContext; id: string }) {
    const record = await getUserById({ context: args.context, id: args.id });

    // TODO: authorization checks
    return record;
  }

  static async signUp(args: {
    context: IContext;
    data: z.infer<typeof UserSignUpSchema>;
  }) {
    UserSignUpSchema.parse(args.data);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(args.data.password, salt);

    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const payload = {
          email: args.data.email,
          password: hash,
        };

        const [user] = await trx<User>('user').insert(payload, '*');

        await Audit.log({
          trx,
          context: args.context,
          data: {
            object: 'user',
            object_id: assertNotNull(user?.id, 'User could not be created'),
            operation: 'create',
            payload,
          },
        });

        return {
          user,
        };
      },
    );

    const { user } = trxResult;

    const token =
      user != null
        ? jwt.sign(
            { sub: user.id, iat: Math.floor(Date.now() / 1000) },
            args.context.config.JWT_SECRET,
            {
              expiresIn: '7d',
            },
          )
        : null;

    return {
      user,
      token,
    };
  }

  static async signIn(args: {
    context: IContext;
    data: z.infer<typeof UserSignInSchema>;
  }) {
    UserSignInSchema.parse(args.data);

    const user = await args.context.services
      .knex<User>('user')
      .where('email', args.data.email)
      .limit(1)
      .first();

    if (user == null) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(args.data.password, user.password);

    if (isValid !== true) {
      throw new Error('Invalid email or password');
    }

    const token =
      user != null
        ? jwt.sign(
            { sub: user.id, iat: Math.floor(Date.now() / 1000) },
            args.context.config.JWT_SECRET,
            {
              expiresIn: '7d',
            },
          )
        : null;

    return {
      user,
      token,
    };
  }
}

const UserSignUpSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const UserSignInSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const getUserById = createLoader(
  async (args: { context: IContext; keys: readonly string[] }) => {
    const users = (await args.context.services
      .knex<User>('user')
      .select(['user.id', 'user.email'])
      .whereIn('id', args.keys)) as unknown as Pick<User, 'id' | 'email'>[];

    return args.keys.map((key) => users.find((user) => user.id === key));
  },
);
