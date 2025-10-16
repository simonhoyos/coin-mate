import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { IContext } from '@/lib/types';

export class User {
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

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(args.data.password, salt);

    const [user] = await args.context.services.knex<User>('user').insert(
      {
        email: args.data.email,
        password: hash,
      },
      '*',
    );

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
