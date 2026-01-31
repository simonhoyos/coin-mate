import jwt from 'jsonwebtoken';
import type { IContext } from './types';

export function createToken(userId: string, context: IContext): string {
  return jwt.sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    context.config.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
}
