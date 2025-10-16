import { z } from 'zod';
import type { IContext } from '@/lib/types';

interface IUser {
  id: string;

  created_at: Date | string;
  updated_at: Date | string;
  email: string;
  password: string;
}

export class User implements IUser {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  email!: string;
  password!: string;

  static async create(args: {
    context: IContext;
    data: z.infer<typeof UserCreationSchema>;
  }) {
    UserCreationSchema.parse(args.data);

    const [user] = await args.context.services.knex<User>('user').insert(
      {
        email: args.data.email,
        password: args.data.password,
      },
      '*',
    );

    return user;
  }
}

const UserCreationSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
