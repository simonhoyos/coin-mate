import { omit } from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { createUser } from '@/lib/testing/factories/user';
import type { Audit } from '../audit';
import { User } from '.';

const USER_BASE_DATA = {
  email: 'test@test.com',
  password: 'Test-password123',
  confirmPassword: 'Test-password123',
};

describe('models/user', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('Authenticated user is authorized to read own data', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const contextWithUser = context.login(user);

    const userRead = assertNotNull(
      await User.gen({
        context: contextWithUser,
        id: user.id,
      }),
    );

    expect(userRead != null).toBeTruthy();
    expect(userRead.email).toBe(user.email);
  });

  it('Authenticated user is not authorized to read users data', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const otherUser = assertNotNull(await createUser(context.services.knex));

    const contextWithUser = context.login(user);

    const userRead = await User.gen({
      context: contextWithUser,
      id: otherUser.id,
    });

    expect(userRead == null).toBeTruthy();
  });

  it('Unauthenticated user is not authorized to read users data', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const userRead = await User.gen({
      context: context,
      id: user.id,
    });

    expect(userRead == null).toBeTruthy();
  });

  it('signs up and password gets hashed, creates an audit log, and a token', async () => {
    const data = {
      email: `test_${crypto.randomUUID()}@coinmate.com`,
      password: 'Test-password123',
      confirmPassword: 'Test-password123',
    };

    const trxResult = await context.services.knex.transaction(async (trx) => {
      const user = await User.signUp({
        trx,
        context,
        data,
      });

      return { user };
    });

    const createdAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object: 'user',
        object_id: trxResult.user.user.id,
        operation: 'create',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(createdAuditLog?.id != null).toBeTruthy();
    expect(createdAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(trxResult.user.user, [
          'id',
          'created_at',
          'updated_at',
          'password',
        ]),
      }),
    );

    expect(trxResult.user.user.password).not.toBe(data.password);

    expect(trxResult.user.token != null).toBeTruthy();
  });

  it.each([
    {
      data: { email: null },
      reason: 'email should be defined',
    },
    {
      data: { email: 'invalid email' },
      reason: 'email should be valid',
    },
    {
      data: { password: null },
      reason: 'password should be defined',
    },
    {
      data: { password: 'a'.repeat(7) },
      reason: 'password should have at least 7 characters',
    },
    {
      data: { password: 'a'.repeat(65) },
      reason: 'password should have at most 64 characters',
    },
    {
      data: { confirmPassword: null },
      reason: 'confirm password should be defined',
    },
    {
      data: { confirmPassword: 'a'.repeat(7) },
      reason: 'confirm password should have at least 7 characters',
    },
    {
      data: { confirmPassword: 'a'.repeat(65) },
      reason: 'confirm password should have at most 64 characters',
    },
    {
      data: { confirmPassword: 'Test-password1234' },
      reason: 'passwords should match',
    },
  ])('fails to sign up with validation error: ($reason)', async ({ data }) => {
    expect(
      context.services.knex.transaction(async (trx) =>
        User.signUp({
          trx,
          context,
          // @ts-expect-error zod validation infer
          data: {
            ...USER_BASE_DATA,
            ...data,
          },
        }),
      ),
    ).rejects.toThrow(ZodError);
  });

  it('signs in and creates  a token', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const signInData = await User.signIn({
      context,
      data: {
        email: user.email,
        password: user.originalPassword,
      },
    });

    expect(signInData.token != null).toBeTruthy();
  });

  it.each([
    {
      data: { email: null, password: 'Test-password123' },
      error: ZodError,
      reason: 'email should be defined',
    },
    {
      data: { email: 'test@test.com', password: null },
      error: ZodError,
      reason: 'password should be defined',
    },
    {
      data: { email: 'test@test.com' },
      error: 'Invalid email or password',
      reason: 'email not found',
    },
    {
      data: { password: '123' },
      error: 'Invalid email or password',
      reason: 'password incorrect',
    },
  ])(
    'fails to sign in with validation error: ($reason)',
    async ({ data, error }) => {
      const user = await createUser(context.services.knex);

      expect(
        User.signIn({
          context,
          data: {
            ...omit(user, [
              'id',
              'created_at',
              'updated_at',
              'password',
              'originalPassword',
            ]),
            // @ts-expect-error zod validation infer
            password: user.originalPassword,
            ...data,
          },
        }),
      ).rejects.toThrow(error);
    },
  );
});
