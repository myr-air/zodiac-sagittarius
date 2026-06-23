export type MajorCurrencyCode = (typeof majorCurrencyCodes)[number];

export interface MajorCurrencyOption {
  code: MajorCurrencyCode;
  label: string;
  symbol: string;
}

export interface MajorCurrencySelectOption {
  value: MajorCurrencyCode;
  label: string;
}

export const majorCurrencyCodes = [
  "HKD",
  "THB",
  "USD",
  "JPY",
  "CNY",
  "EUR",
  "GBP",
  "SGD",
  "KRW",
  "TWD",
] as const;

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

export function majorCurrencySelectOptions(): MajorCurrencySelectOption[] {
  return majorCurrencyOptions.map((option) => ({
    value: option.code,
    label: `${option.code} · ${option.label}`,
  }));
}

const majorCurrencySet = new Set<string>(majorCurrencyCodes);

export function isMajorCurrencyCode(value: string): value is MajorCurrencyCode {
  return majorCurrencySet.has(value);
}

export function normalizeCurrencyCode(currency: string): MajorCurrencyCode {
  const normalized = currency.trim().toUpperCase();
  return isMajorCurrencyCode(normalized) ? normalized : "HKD";
}
