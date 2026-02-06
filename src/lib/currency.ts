import { ExchangeRate } from '@/models/exchange-rate';
import type { IContext } from './types';

export async function fetchExchangeRate(
  context: IContext,
  pair: string,
): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const body = await response.json();
    const result = body?.chart?.result?.[0];
    const rate = result?.meta?.regularMarketPrice;

    if (rate == null) {
      throw new Error('Invalid response format from Yahoo Finance');
    }

    await ExchangeRate.logRate({
      context,
      data: {
        currencyCode: pair,
        rateCents: Math.round(rate * 100),
        provider: 'yahoo',
        data: body,
      },
    });

    return rate;
  } catch (error) {
    console.error(`Error fetching exchange rate for ${pair}:`, error);

    const cached = await ExchangeRate.getLatestRate({
      context,
      currencyCode: pair,
    });

    if (cached) {
      return cached.rate_cents / 100;
    }

    throw new Error('Could not fetch exchange rate and no cache available');
  }
}
