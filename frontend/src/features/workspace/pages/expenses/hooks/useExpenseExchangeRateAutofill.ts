import { useEffect } from "react";
import { fetchMajorExchangeRate, normalizeCurrencyCode, type MajorCurrencyCode } from "@/src/trip/currencies";
import { formatExchangeRateInput } from "../expense-page-support";

interface UseExpenseExchangeRateAutofillInput {
  apiBaseUrl: string;
  exchangeRateTouched: boolean;
  needsExchangeRate: boolean;
  normalizedCurrency: MajorCurrencyCode;
  settlementCurrency: string;
  onExchangeRateChange: (value: string) => void;
}

export function useExpenseExchangeRateAutofill({
  apiBaseUrl,
  exchangeRateTouched,
  needsExchangeRate,
  normalizedCurrency,
  settlementCurrency,
  onExchangeRateChange,
}: UseExpenseExchangeRateAutofillInput) {
  useEffect(() => {
    let cancelled = false;
    if (!needsExchangeRate || exchangeRateTouched) return;

    fetchMajorExchangeRate(normalizedCurrency, normalizeCurrencyCode(settlementCurrency), {
      backendBaseUrl: apiBaseUrl,
    })
      .then((quote) => {
        if (!cancelled && quote) {
          onExchangeRateChange(formatExchangeRateInput(quote.rate));
        }
      })
      .catch(() => {
        // Keep manual exchange-rate entry available when the provider is offline.
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, exchangeRateTouched, needsExchangeRate, normalizedCurrency, onExchangeRateChange, settlementCurrency]);
}
