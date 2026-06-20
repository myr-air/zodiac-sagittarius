import type { MajorCurrencyCode } from "./currency-catalog";
import type { ExchangeRateQuote, FetchMajorExchangeRateOptions } from "./exchange-rate-types";
import {
  readCachedExchangeRate,
  safeLocalStorage,
  writeCachedExchangeRate,
} from "./exchange-rate-cache";
import {
  fetchBackendRate,
  fetchFrankfurterRate,
} from "./exchange-rate-providers";

export { exchangeRateCacheKey } from "./exchange-rate-cache";
export { buildBackendRatesUrl } from "./exchange-rate-providers";
export type { ExchangeRateQuote, FetchMajorExchangeRateOptions } from "./exchange-rate-types";

export async function fetchMajorExchangeRate(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  options: FetchMajorExchangeRateOptions = {},
): Promise<ExchangeRateQuote | null> {
  if (source === target) {
    return { date: null, rate: 1, source, target };
  }

  const now = options.now ?? Date.now();
  const storage = options.storage ?? safeLocalStorage();
  const cached = readCachedExchangeRate(source, target, storage, now);
  if (cached) return cached;

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) return null;

  const quote =
    (await fetchBackendRate(source, target, fetchImpl, options.backendBaseUrl)) ??
    (await fetchFrankfurterRate(source, target, fetchImpl));
  if (!quote) return null;

  writeCachedExchangeRate(quote, storage, now);
  return quote;
}
