export type MajorCurrencyCode = (typeof majorCurrencyCodes)[number];

export interface MajorCurrencyOption {
  code: MajorCurrencyCode;
  label: string;
  symbol: string;
}

export interface ExchangeRateQuote {
  date: string | null;
  rate: number;
  source: MajorCurrencyCode;
  target: MajorCurrencyCode;
}

interface FetchMajorExchangeRateOptions {
  backendBaseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: number;
  storage?: Storage | null;
}

interface CachedExchangeRateQuote extends ExchangeRateQuote {
  cachedAt: number;
}

export const majorCurrencyCodes = ["HKD", "THB", "USD", "JPY", "CNY", "EUR", "GBP", "SGD", "KRW", "TWD"] as const;

export const majorCurrencyOptions: MajorCurrencyOption[] = [
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$" },
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "KRW", label: "South Korean Won", symbol: "₩" },
  { code: "TWD", label: "New Taiwan Dollar", symbol: "NT$" },
];

const majorCurrencySet = new Set<string>(majorCurrencyCodes);
const backendRatesPath = "/api/v1/exchange-rates";
const frankfurterRatesEndpoint = "https://api.frankfurter.dev/v2/rates";
const cacheTtlMs = 24 * 60 * 60 * 1000;

export function isMajorCurrencyCode(value: string): value is MajorCurrencyCode {
  return majorCurrencySet.has(value);
}

export function normalizeCurrencyCode(currency: string): MajorCurrencyCode {
  const normalized = currency.trim().toUpperCase();
  return isMajorCurrencyCode(normalized) ? normalized : "HKD";
}

export function exchangeRateCacheKey(source: MajorCurrencyCode, target: MajorCurrencyCode): string {
  return `sagittarius-exchange-rate:${source}:${target}`;
}

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

  const quote = await fetchBackendRate(source, target, fetchImpl, options.backendBaseUrl)
    ?? await fetchFrankfurterRate(source, target, fetchImpl);
  if (!quote) return null;

  writeCachedExchangeRate(quote, storage, now);
  return quote;
}

async function fetchBackendRate(
  source: MajorCurrencyCode,
  target: MajorCurrencyCode,
  fetchImpl: typeof fetch,
  backendBaseUrl = "",
): Promise<ExchangeRateQuote | null> {
  try {
    const response = await fetchImpl(buildBackendRatesUrl(source, target, backendBaseUrl));
    if (!response.ok) return null;
    return parseBackendRate(await response.json(), source, target);
  } catch {
    return null;
  }
}

async function fetchFrankfurterRate(
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

function buildBackendRatesUrl(source: MajorCurrencyCode, target: MajorCurrencyCode, backendBaseUrl = ""): string {
  const baseUrl = backendBaseUrl.endsWith("/") ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
  return `${baseUrl}${backendRatesPath}?${new URLSearchParams({ base: source, quote: target })}`;
}

function buildFrankfurterRatesUrl(source: MajorCurrencyCode, target: MajorCurrencyCode): string {
  const url = new URL(frankfurterRatesEndpoint);
  url.searchParams.set("base", source);
  url.searchParams.set("quotes", target);
  return url.toString();
}

function parseBackendRate(payload: unknown, source: MajorCurrencyCode, target: MajorCurrencyCode): ExchangeRateQuote | null {
  if (
    payload
    && typeof payload === "object"
    && (payload as { base?: unknown }).base === source
    && (payload as { quote?: unknown }).quote === target
    && typeof (payload as { rate?: unknown }).rate === "number"
    && Number.isFinite((payload as { rate: number }).rate)
    && (payload as { rate: number }).rate > 0
  ) {
    return {
      date: typeof (payload as { date?: unknown }).date === "string" ? (payload as { date: string }).date : null,
      rate: (payload as { rate: number }).rate,
      source,
      target,
    };
  }
  return null;
}

function parseFrankfurterRate(payload: unknown, source: MajorCurrencyCode, target: MajorCurrencyCode): ExchangeRateQuote | null {
  if (Array.isArray(payload)) {
    const match = payload.find((entry) => isRateEntry(entry, source, target));
    return match ? { date: typeof match.date === "string" ? match.date : null, rate: match.rate, source, target } : null;
  }

  if (payload && typeof payload === "object" && "rates" in payload) {
    const ratePayload = payload as { date?: unknown; rates?: Record<string, unknown> };
    const rates = ratePayload.rates;
    const rate = rates?.[target];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return { date: typeof ratePayload.date === "string" ? ratePayload.date : null, rate, source, target };
    }
  }

  return null;
}

function isRateEntry(entry: unknown, source: MajorCurrencyCode, target: MajorCurrencyCode): entry is { base: string; date?: string; quote: string; rate: number } {
  return Boolean(
    entry
      && typeof entry === "object"
      && (entry as { base?: unknown }).base === source
      && (entry as { quote?: unknown }).quote === target
      && typeof (entry as { rate?: unknown }).rate === "number"
      && Number.isFinite((entry as { rate: number }).rate)
      && (entry as { rate: number }).rate > 0,
  );
}

function readCachedExchangeRate(source: MajorCurrencyCode, target: MajorCurrencyCode, storage: Storage | null, now: number): ExchangeRateQuote | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(exchangeRateCacheKey(source, target));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedExchangeRateQuote>;
    if (
      parsed.source === source
      && parsed.target === target
      && typeof parsed.rate === "number"
      && Number.isFinite(parsed.rate)
      && parsed.rate > 0
      && typeof parsed.cachedAt === "number"
      && now - parsed.cachedAt < cacheTtlMs
    ) {
      return { date: typeof parsed.date === "string" ? parsed.date : null, rate: parsed.rate, source, target };
    }
  } catch {
    return null;
  }
  return null;
}

function writeCachedExchangeRate(quote: ExchangeRateQuote, storage: Storage | null, now: number) {
  if (!storage) return;
  try {
    storage.setItem(exchangeRateCacheKey(quote.source, quote.target), JSON.stringify({ ...quote, cachedAt: now }));
  } catch {
    // The fetched rate is still useful for the current calculation.
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
