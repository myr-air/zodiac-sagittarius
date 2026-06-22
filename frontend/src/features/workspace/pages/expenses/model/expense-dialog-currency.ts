import { normalizeCurrencyCode } from "@/src/trip/currencies";

export interface ExpenseDialogExchangeRateFields {
  exchangeRate: string;
  exchangeRateTouched: boolean;
}

export interface ExpenseDialogCurrencyFields extends ExpenseDialogExchangeRateFields {
  currency: string;
}

export function expenseDialogCurrencyChangeFields(
  nextCurrency: string,
): ExpenseDialogCurrencyFields {
  return {
    currency: normalizeCurrencyCode(nextCurrency),
    exchangeRate: "1",
    exchangeRateTouched: false,
  };
}

export function expenseDialogManualExchangeRateFields(
  nextExchangeRate: string,
): ExpenseDialogExchangeRateFields {
  return {
    exchangeRate: nextExchangeRate,
    exchangeRateTouched: true,
  };
}
