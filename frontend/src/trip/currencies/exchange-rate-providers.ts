import type { MajorCurrencyCode } from "./currency-catalog";
import type { ExchangeRateQuote } from "./exchange-rate-types";

const backendRatesPath = "/api/v1/exchange-rates";
const frankfurterRatesEndpoint = "https://api.frankfurter.dev/v2/rates";

export async function fetchBackendRate(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  fetchImpl: typeof fetch,
  backendBaseUrl = "",
): Promise<ExchangeRateQuote | null> {
  try {
    const response = await fetchImpl(
      buildBackendRatesUrl(source, target, backendBaseUrl),
    );
    if (!response.ok) return null;
    return parseBackendRate(await response.json(), source, target);
  } catch {
    return null;
  }
}

export async function fetchFrankfurterRate(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  fetchImpl: typeof fetch,
): Promise<ExchangeRateQuote | null> {
  try {
    const response = await fetchImpl(buildFrankfurterRatesUrl(source, target));
    if (!response.ok) return null;
    return parseFrankfurterRate(await response.json(), source, target);
  } catch {
    return null;
  }
}

export function buildBackendRatesUrl(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  backendBaseUrl = "",
): string {
  const baseUrl = backendBaseUrl.endsWith("/")
    ? backendBaseUrl.slice(0, -1)
    : backendBaseUrl;
  return `${baseUrl}${backendRatesPath}?${new URLSearchParams({
    base: source,
    quote: target,
  })}`;
}

function buildFrankfurterRatesUrl(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
): string {
  const url = new URL(frankfurterRatesEndpoint);
  url.searchParams.set("base", source);
  url.searchParams.set("quotes", target);
  return url.toString();
}

function parseBackendRate(
  payload: unknown,
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
): ExchangeRateQuote | null {
  if (
    payload &&
    typeof payload === "object" &&
    (payload as { base?: unknown }).base === source &&
    (payload as { quote?: unknown }).quote === target &&
    typeof (payload as { rate?: unknown }).rate === "number" &&
    Number.isFinite((payload as { rate: number }).rate) &&
    (payload as { rate: number }).rate > 0
  ) {
    return {
      date:
        typeof (payload as { date?: unknown }).date === "string"
          ? (payload as { date: string }).date
          : null,
      rate: (payload as { rate: number }).rate,
      source,
      target,
    };
  }
  return null;
}

function parseFrankfurterRate(
  payload: unknown,
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
): ExchangeRateQuote | null {
  if (Array.isArray(payload)) {
    const match = payload.find((entry) => isRateEntry(entry, source, target));
    return match
      ? {
          date: typeof match.date === "string" ? match.date : null,
          rate: match.rate,
          source,
          target,
        }
      : null;
  }

  if (payload && typeof payload === "object" && "rates" in payload) {
    const ratePayload = payload as {
      date?: unknown;
      rates?: Record<string, unknown>;
    };
    const rate = ratePayload.rates?.[target];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return {
        date: typeof ratePayload.date === "string" ? ratePayload.date : null,
        rate,
        source,
        target,
      };
    }
  }

  return null;
}

function isRateEntry(
  entry: unknown,
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
): entry is { base: string; date?: string; quote: string; rate: number } {
  return Boolean(
    entry &&
      typeof entry === "object" &&
      (entry as { base?: unknown }).base === source &&
      (entry as { quote?: unknown }).quote === target &&
      typeof (entry as { rate?: unknown }).rate === "number" &&
      Number.isFinite((entry as { rate: number }).rate) &&
      (entry as { rate: number }).rate > 0,
  );
}
