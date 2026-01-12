import { User } from '@/models/user';

export function createUserFactory(overrides: Partial<User> = {}): User {
  const id = crypto.randomUUID();
  return {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email: `user-${id.slice(0, 8)}@example.com`,
    password: '$2a$10$hashedpasswordplaceholder',
    ...overrides,
  } as User;
}
