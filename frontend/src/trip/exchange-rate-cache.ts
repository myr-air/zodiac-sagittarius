import type { MajorCurrencyCode } from "./currency-catalog";
import type { ExchangeRateQuote } from "./exchange-rate-types";

interface CachedExchangeRateQuote extends ExchangeRateQuote {
  cachedAt: number;
}

const cacheTtlMs = 24 * 60 * 60 * 1000;

export function exchangeRateCacheKey(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
): string {
  return `sagittarius-exchange-rate:${source}:${target}`;
}

export function readCachedExchangeRate(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  storage: Storage | null,
  now: number,
): ExchangeRateQuote | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(exchangeRateCacheKey(source, target));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedExchangeRateQuote>;
    if (
      parsed.source === source &&
      parsed.target === target &&
      typeof parsed.rate === "number" &&
      Number.isFinite(parsed.rate) &&
      parsed.rate > 0 &&
      typeof parsed.cachedAt === "number" &&
      now - parsed.cachedAt < cacheTtlMs
    ) {
      return {
        date: typeof parsed.date === "string" ? parsed.date : null,
        rate: parsed.rate,
        source,
        target,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function writeCachedExchangeRate(
  quote: ExchangeRateQuote,
  storage: Storage | null,
  now: number,
) {
  if (!storage) return;
  try {
    storage.setItem(
      exchangeRateCacheKey(quote.source, quote.target),
      JSON.stringify({ ...quote, cachedAt: now }),
    );
  } catch {
    // The fetched rate is still useful for the current calculation.
  }
}

export function safeLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
