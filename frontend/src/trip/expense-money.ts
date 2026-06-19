import type { Expense } from "./types";

export function expenseAmountInSettlementCurrency(
  expense: Expense,
  settlementCurrency = "HKD",
  exchangeRates?: Record<string, number>,
): number {
  return convertToSettlementCurrency(
    expense.amount,
    expenseExchangeRate(expense, settlementCurrency, exchangeRates),
  );
}

export function expenseExchangeRate(
  expense: Expense,
  settlementCurrency: string,
  exchangeRates?: Record<string, number>,
): number {
  const currency = normalizeCurrency(expense.currency ?? settlementCurrency);
  if (currency === settlementCurrency) return 1;
  const directRate = expense.exchangeRateToSettlementCurrency;
  if (typeof directRate === "number" && Number.isFinite(directRate) && directRate > 0) return directRate;
  const configuredRate = exchangeRates?.[currency];
  return typeof configuredRate === "number" && Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 1;
}

export function convertToSettlementCurrency(amount: number, exchangeRate: number): number {
  return roundMoney(amount * exchangeRate);
}

export function formatMoney(amount: number, currency = "HKD"): string {
  const normalizedCurrency = normalizeCurrency(currency);
  const prefixByCurrency: Record<string, string> = {
    CNY: "CN¥",
    EUR: "€",
    GBP: "£",
    HKD: "HK$",
    JPY: "¥",
    KRW: "₩",
    SGD: "S$",
    THB: "฿",
    TWD: "NT$",
    USD: "US$",
  };
  const prefix = prefixByCurrency[normalizedCurrency] ?? `${normalizedCurrency} `;
  const sign = amount < 0 ? "-" : "";
  return `${sign}${prefix}${Math.abs(roundMoney(amount)).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "HKD";
}
