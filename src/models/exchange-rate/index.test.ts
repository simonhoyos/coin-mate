import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNotNull } from '@/lib/assert';
import { createTestContext, type ITestContext } from '@/lib/testing/context';
import { ExchangeRate } from '.';

describe('ExchangeRate', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  it('logs and retrieve the latest exchange rate', async () => {
    const currencyCode = `USDCOP-${crypto.randomUUID()}`;
    const rateCents = 4_100_00;
    const provider = 'test_provider';
    const data = { meta: 'test_data' };

    const loggedRate = assertNotNull(
      await ExchangeRate.logRate({
        context,
        data: {
          currencyCode,
          rateCents,
          provider,
          data,
        },
      }),
    );

    expect(loggedRate).toBeDefined();
    expect(loggedRate.currency_code).toBe(currencyCode);
    expect(loggedRate.rate_cents).toBe(rateCents);
    expect(loggedRate.provider).toBe(provider);
    expect(loggedRate.data).toEqual(data);
    expect(loggedRate.created_at).toBeDefined();

    const fetchedRate = await ExchangeRate.getLatestRate({
      context,
      currencyCode,
    });

    expect(fetchedRate).toBeDefined();
    expect(fetchedRate?.id).toBe(loggedRate.id);
    expect(fetchedRate?.rate_cents).toBe(rateCents);
  });

  it('fails if no rate exists', async () => {
    expect(
      ExchangeRate.getLatestRate({
        context,
        currencyCode: 'NON_EXISTENT',
      }),
    ).rejects.toThrow('Exchange rate not found');
  });

  it('retrieves the most recent rate among multiple entries', async () => {
    const currencyCode = 'USDCOP_LATEST_TEST';

    await ExchangeRate.logRate({
      context,
      data: {
        currencyCode,
        rateCents: 400000,
        provider: 'test',
        data: null,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newerRate = assertNotNull(
      await ExchangeRate.logRate({
        context,
        data: {
          currencyCode,
          rateCents: 420000,
          provider: 'test',
          data: null,
        },
      }),
    );

    const latest = await ExchangeRate.getLatestRate({
      context,
      currencyCode,
    });

    expect(latest?.id).toBe(newerRate.id);
    expect(latest?.rate_cents).toBe(420000);
  });
});
