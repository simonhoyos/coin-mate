import { format } from 'date-fns';
import { omit } from 'lodash';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ZodError } from 'zod';
import { assertNotNull } from '@/lib/assert';
import * as CurrencyLib from '@/lib/currency';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';
import type { Audit } from '../audit';
import { TransactionLedger } from '.';

const TRANSACTION_BASE_DATA = {
  concept: 'a'.repeat(64),
  description: 'a'.repeat(256),
  currency: 'COP',
  amount_cents: '10000.00',
  transacted_at: new Date().toISOString(),
  type: 'expense',
};

describe('models/category', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Authenticated user is authorized to create/read/update/delete an owned transaction', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const contextWithUser = context.login(user);

    const space = assertNotNull(
      await createSpace(context.services.knex, {
        user_id: user.id,
      }),
    );

    const category = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
      }),
    );

    const createdTransaction = assertNotNull(
      (
        await TransactionLedger.create({
          context: contextWithUser,
          data: {
            ...TRANSACTION_BASE_DATA,
            category_id: category.id,
          },
        })
      ).transactionLedger,
    );

    const createdAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: createdTransaction.id,
        user_id: user.id,
        object: 'transaction_ledger',
        operation: 'create',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(createdAuditLog?.id != null).toBeTruthy();
    expect(createdAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(createdTransaction, [
          'created_at',
          'updated_at',
          'archived_at',
          'id',
          'amount_cents',
          'original_amount_cents',
          'transacted_at',
        ]),
        amount_cents: Number(createdTransaction.amount_cents),
        original_amount_cents: Number(createdTransaction.original_amount_cents),
        transacted_at: new Date(createdTransaction.transacted_at).toISOString(),
      }),
    );

    const updatedTransaction = assertNotNull(
      (
        await TransactionLedger.update({
          context: contextWithUser,
          data: {
            id: createdTransaction.id,
            category_id: category.id,
            ...TRANSACTION_BASE_DATA,
            concept: 'updated concept',
          },
        })
      ).transaction,
    );

    const updatedAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: updatedTransaction.id,
        user_id: user.id,
        object: 'transaction_ledger',
        operation: 'update',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(updatedAuditLog?.id != null).toBeTruthy();
    expect(updatedAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        ...omit(updatedTransaction, [
          'created_at',
          'updated_at',
          'archived_at',
          'id',
          'amount_cents',
          'original_amount_cents',
          'transacted_at',
          'space_id',
          'user_id'
        ]),
        amount_cents: Number(updatedTransaction.amount_cents),
        original_amount_cents: Number(updatedTransaction.original_amount_cents),
        transacted_at: new Date(updatedTransaction.transacted_at).toISOString(),
      }),
    );

    const deletedTransaction = assertNotNull(
      (
        await TransactionLedger.delete({
          context: contextWithUser,
          data: {
            id: updatedTransaction.id,
          },
        })
      ).transaction,
    );

    const deletedAuditLog = await context.services
      .knex<Audit>('audit')
      .where({
        object_id: deletedTransaction.id,
        user_id: user.id,
        object: 'transaction_ledger',
        operation: 'delete',
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    expect(deletedAuditLog?.id != null).toBeTruthy();
    expect(deletedAuditLog?.data.payload).toMatchObject(
      expect.objectContaining({
        archived_at: new Date(
          assertNotNull(deletedTransaction.archived_at),
        ).toISOString(),
      }),
    );
  });

  it('converts USD to COP when creating a transaction', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const contextWithUser = context.login(user);

    const space = await createSpace(context.services.knex, {
      user_id: user.id,
    });

    const category = await createCategory(context.services.knex, {
      space_id: assertNotNull(space?.id),
    });

    vi.spyOn(CurrencyLib, 'fetchExchangeRate').mockResolvedValue(4000.0);

    const createdTransaction = assertNotNull(
      (
        await TransactionLedger.create({
          context: contextWithUser,
          data: {
            concept: 'Test USD Transaction',
            description: 'Buying something in USD',
            currency: 'USD',
            amount_cents: '1050.00',
            transacted_at: format(new Date(), 'yyyy-MM-dd'),
            type: 'expense',
            category_id: assertNotNull(category?.id),
          },
        })
      ).transactionLedger,
    );

    const transactionLedger = await contextWithUser.services
      .knex<TransactionLedger>('transaction_ledger')
      .where({ id: assertNotNull(createdTransaction.id) })
      .limit(1)
      .first();

    expect(transactionLedger?.original_currency).toBe('USD');
    expect(Number(transactionLedger?.original_amount_cents)).toBe(1_050_00);

    expect(transactionLedger?.currency).toBe('COP');
    expect(Number(transactionLedger?.amount_cents)).toBe(4_200_000_00);
  });

  it.each([
    {
      data: { ...TRANSACTION_BASE_DATA, concept: '' },
      reason: 'concept too short',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, concept: 'a'.repeat(65) },
      reason: 'concept too long',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, description: 'a'.repeat(257) },
      reason: 'concept too long',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, currency: 'UNSUPPORTED' },
      reason: 'currency unsupported',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, amount_cents: '1000' },
      reason: 'amount format not decimal',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, amount_cents: '1000.000' },
      reason: 'amount format too many decimal points',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, amount_cents: '1000.00.00' },
      reason: 'amount format more than one decimal separator',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, amount_cents: 'NAN' },
      reason: 'amount format not a number',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, transacted_at: 'NOT_A_DATE' },
      reason: 'transacted_at format not a date',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, type: 'UNSUPPORTED' },
      reason: 'type unsupported',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, category_id: 'NOT_AN_UUID' },
      reason: 'category not an uuid',
    },
    {
      data: { ...TRANSACTION_BASE_DATA, category_id: undefined },
      reason: 'category not defined',
    },
  ])(
    'fails to create/update category with validation error: ($reason)',
    async ({ data }) => {
      const user = assertNotNull(await createUser(context.services.knex));
      const contextWithUser = context.login(user);

      const space = assertNotNull(
        await createSpace(context.services.knex, {
          user_id: user.id,
        }),
      );

      const category = assertNotNull(
        await createCategory(context.services.knex, {
          user_id: user.id,
          space_id: space.id,
        }),
      );

      await expect(
        TransactionLedger.create({
          context: contextWithUser,
          data: {
            // @ts-expect-error data validation inference error
            category_id: category.id,
            ...data,
          },
        }),
      ).rejects.toThrow(ZodError);

      const transaction = assertNotNull(
        await createTransactionLedger(context.services.knex, {
          category_id: category.id,
          space_id: space.id,
          user_id: user.id,
        }),
      );

      await expect(
        TransactionLedger.update({
          context: contextWithUser,
          data: {
            id: transaction.id,
            // @ts-expect-error data validation inference error
            category_id: category.id,
            ...data,
          },
        }),
      ).rejects.toThrow(ZodError);
    },
  );

  it('Authenticated user is not authorized to read/update/delete not owned transactions', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const otherUser = assertNotNull(await createUser(context.services.knex));

    const otherSpace = assertNotNull(
      await createSpace(context.services.knex, {
        user_id: otherUser.id,
      }),
    );

    const otherCategory = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: otherUser.id,
        space_id: otherSpace.id,
      }),
    );

    const otherTransaction = assertNotNull(
      await createTransactionLedger(context.services.knex, {
        user_id: otherUser.id,
        space_id: otherSpace.id,
        category_id: otherCategory.id,
      }),
    );

    const contextWithUser = context.login(user);

    const category = await TransactionLedger.gen({
      context: contextWithUser,
      id: otherCategory.id,
    });

    expect(category == null).toBeTruthy();

    await expect(
      TransactionLedger.update({
        context: contextWithUser,
        data: {
          id: otherTransaction.id,
          category_id: otherCategory.id,
          ...TRANSACTION_BASE_DATA,
        },
      }),
    ).rejects.toThrow('Transaction not found');

    await expect(
      TransactionLedger.delete({
        context: contextWithUser,
        data: {
          id: otherTransaction.id,
        },
      }),
    ).rejects.toThrow('Transaction not found');
  });

  it('Unauthenticated user is not authorized to create/read/update/delete transactions', async () => {
    const user = assertNotNull(await createUser(context.services.knex));

    const space = assertNotNull(
      await createSpace(context.services.knex, {
        user_id: user.id,
      }),
    );

    const category = assertNotNull(
      await createCategory(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
      }),
    );

    const transaction = assertNotNull(
      await createTransactionLedger(context.services.knex, {
        user_id: user.id,
        space_id: space.id,
        category_id: category.id,
      }),
    );

    expect(
      (await TransactionLedger.gen({
        context,
        id: category.id,
      })) == null,
    ).toBeTruthy();

    await expect(
      TransactionLedger.create({
        context,
        data: {
          category_id: category.id,
          ...TRANSACTION_BASE_DATA,
        },
      }),
    ).rejects.toThrow('User must be authenticated to create a transaction');

    await expect(
      TransactionLedger.update({
        context,
        data: {
          id: transaction.id,
          category_id: category.id,
          ...TRANSACTION_BASE_DATA,
        },
      }),
    ).rejects.toThrow('User must be authenticated to update a transaction');

    await expect(
      TransactionLedger.delete({
        context,
        data: {
          id: category.id,
        },
      }),
    ).rejects.toThrow('User must be authenticated to delete a transaction');
  });
});
