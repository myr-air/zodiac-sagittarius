import type { MajorCurrencyCode } from "./currency-catalog";

export interface ExchangeRateQuote {
  date: string | null;
  rate: number;
  source: MajorCurrencyCode;
  target: MajorCurrencyCode;
}

export interface FetchMajorExchangeRateOptions {
  backendBaseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: number;
  storage?: Storage | null;
}
