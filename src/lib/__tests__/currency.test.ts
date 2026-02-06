import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ExchangeRate } from '@/models/exchange-rate';
import { fetchExchangeRate } from '../currency';
import { createTestContext, type ITestContext } from '../testing/context';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('fetchExchangeRate', () => {
  const destroyers: (() => Promise<unknown>)[] = [];
  let context: ITestContext;

  beforeAll(async () => {
    context = await createTestContext();
    destroyers.push(context.cleanup);
  });

  afterAll(async () => Promise.all(destroyers.map((destroy) => destroy())));

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch rate from API and log it on success', async () => {
    const mockResponse = {
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 4150.5,
            },
          },
        ],
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    vi.spyOn(ExchangeRate, 'logRate');

    const rate = await fetchExchangeRate(context, 'USDCOP');

    expect(rate).toBe(4150.5);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDCOP=X',
    );
    expect(ExchangeRate.logRate).toHaveBeenCalledWith({
      context,
      data: {
        currencyCode: 'USDCOP',
        rateCents: 415050,
        provider: 'yahoo',
        data: mockResponse,
      },
    });
  });

  it('should return cached rate if API fails', async () => {
    const mockResponse = {
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 4300,
            },
          },
        ],
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchExchangeRate(context, 'USDCOP');

    vi.spyOn(ExchangeRate, 'getLatestRate');

    fetchMock.mockRejectedValue(new Error('API Error'));

    const rate = await fetchExchangeRate(context, 'USDCOP');

    expect(rate).toBe(4300);
    expect(ExchangeRate.getLatestRate).toHaveBeenCalledWith({
      context,
      currencyCode: 'USDCOP',
    });
  });

  it('should throw error if API fails and no cache exists', async () => {
    fetchMock.mockRejectedValue(new Error('API Error'));

    vi.mocked(ExchangeRate.getLatestRate).mockResolvedValue(null);

    await expect(fetchExchangeRate(context, 'USDCOP')).rejects.toThrow(
      'Could not fetch exchange rate',
    );
  });
});
