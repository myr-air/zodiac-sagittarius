import { formatMoney, normalizeCurrency, roundMoney } from "@/src/trip/expenses";

export interface ExpenseDisplayCurrencyOptions {
  displayCurrency?: string;
  displayExchangeRate?: number;
  settlementCurrency: string;
}

export function validDisplayExchangeRate(rate: number | undefined): number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : 1;
}

export function displayCurrencyCode({
  displayCurrency,
  settlementCurrency,
}: Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "settlementCurrency">): string {
  return normalizeCurrency(displayCurrency ?? settlementCurrency);
}

export function convertSettlementAmountForDisplay(
  amount: number,
  options: ExpenseDisplayCurrencyOptions,
): number {
  const targetCurrency = displayCurrencyCode(options);
  const sourceCurrency = normalizeCurrency(options.settlementCurrency);
  if (targetCurrency === sourceCurrency) return roundMoney(amount);
  return roundMoney(amount * validDisplayExchangeRate(options.displayExchangeRate));
}

export function formatSettlementAmountForDisplay(
  amount: number,
  options: ExpenseDisplayCurrencyOptions,
): string {
  return formatMoney(
    convertSettlementAmountForDisplay(amount, options),
    displayCurrencyCode(options),
  );
}

export function formatExchangeRateForDisplay(rate: number): string {
  return Number.isInteger(rate)
    ? String(rate)
    : rate.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
