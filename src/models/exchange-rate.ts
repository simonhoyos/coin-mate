import { assertNotNull } from '@/lib/assert';
import type { IContext } from '@/lib/types';

export class ExchangeRate {
  id!: string;

  created_at!: Date | string;
  updated_at!: Date | string;

  currency_code!: string;
  rate_cents!: number;
  provider!: string;
  data?: Record<string, unknown> | null;

  static async logRate(args: {
    context: IContext;
    data: {
      currencyCode: string;
      rateCents: number;
      provider: string;
      data?: Record<string, unknown> | null;
    };
  }) {
    const trxResult = await args.context.services.knex.transaction(
      async (trx) => {
        const [exchangeRate] = await trx<ExchangeRate>('exchange_rate_cache')
          .insert(
            {
              currency_code: args.data.currencyCode,
              rate_cents: args.data.rateCents,
              provider: args.data.provider,
              data: args.data.data ?? null,
            },
            '*',
          )
          .returning('*');

        return {
          exchangeRate: exchangeRate
            ? {
                ...exchangeRate,
                rate_cents: Number(exchangeRate.rate_cents),
              }
            : null,
        };
      },
    );

    return assertNotNull(trxResult.exchangeRate, 'Could not log exchange rate');
  }

  static async getLatestRate(args: {
    context: IContext;
    currencyCode: string;
  }) {
    const rate = await args.context.services
      .knex<ExchangeRate>('exchange_rate_cache')
      .where({
        currency_code: args.currencyCode,
      })
      .orderBy('created_at', 'desc')
      .first();

    return rate
      ? {
          ...rate,
          rate_cents: Number(rate.rate_cents),
        }
      : null;
  }
}
