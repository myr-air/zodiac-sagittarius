import { normalizeCurrencyCode, type MajorCurrencyCode } from "@/src/trip/currencies";

export const currencyStorageKey = "sagittarius-currency";

export function readStoredCurrency(): MajorCurrencyCode {
  try {
    const stored = window.localStorage.getItem(currencyStorageKey);
    return stored ? normalizeCurrencyCode(stored) : "HKD";
  } catch {
    return "HKD";
  }
}
