import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { z } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createLoader } from '@/lib/dataloader';
import { createToken } from '@/lib/token';
import type { IContext } from '@/lib/types';
import { Audit } from '../audit';

export class User {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  email!: string;
  password!: string;

  static async gen(args: { context: IContext; id: string }) {
    const record = await getUserById({ context: args.context, id: args.id });

    return args.context.user?.id === record?.id ? record : null;
  }

  static async signUp(args: {
    trx: Knex.Transaction;
    context: IContext;
    data: z.infer<typeof UserSignUpSchema>;
  }) {
    const parsedData = UserSignUpSchema.parse(args.data);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(parsedData.password, salt);

    const payload = {
      email: parsedData.email,
      password: hash,
    };

    const user = assertNotNull(
      (await args.trx<User>('user').insert(payload, '*')).at(0),
      'User could not be created',
    );

    await Audit.log({
      trx: args.trx,
      context: args.context,
      data: {
        object: 'user',
        object_id: user?.id,
        operation: 'create',
        payload,
      },
    });

    const token = createToken(user.id, args.context);

    return {
      user,
      token,
    };
  }

  static async signIn(args: {
    context: IContext;
    data: z.infer<typeof UserSignInSchema>;
  }) {
    const parsedData = UserSignInSchema.parse(args.data);

    const user = await args.context.services
      .knex<User>('user')
      .where('email', parsedData.email)
      .limit(1)
      .first();

    if (user == null) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(parsedData.password, user.password);

    if (isValid !== true) {
      throw new Error('Invalid email or password');
    }

    const token = createToken(user.id, args.context);

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
