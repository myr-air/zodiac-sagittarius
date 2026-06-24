import { formatMoney, normalizeCurrency } from "./expense-money";
import type { Expense } from "./expense-types";

export interface StoredValueCardBalance {
  balance: number;
  cardId: string;
  cardName: string;
  currency: string;
  spend: number;
  topUp: number;
  transactionCount: number;
}

export function isStoredValueFundingExpense(expense: Pick<Expense, "storedValueTransactionType">): boolean {
  return expense.storedValueTransactionType === "topup" || expense.storedValueTransactionType === "refund";
}

function storedValueCardKey(expense: Expense): string | null {
  return expense.storedValueCardId || expense.storedValueCardName || null;
}

function storedValueBalanceKey(expense: Expense): string | null {
  const cardKey = storedValueCardKey(expense);
  if (!cardKey) return null;
  return `${cardKey}:${normalizeCurrency(expense.currency ?? "HKD")}`;
}

function roundCurrencyAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function buildStoredValueCardBalances(expenses: Expense[]): StoredValueCardBalance[] {
  const balances = new Map<string, StoredValueCardBalance>();

  for (const expense of expenses) {
    const transactionType = expense.storedValueTransactionType;
    const balanceKey = storedValueBalanceKey(expense);
    if (!transactionType || !balanceKey) continue;

    const cardKey = storedValueCardKey(expense) ?? balanceKey;
    const current = balances.get(balanceKey) ?? {
      balance: 0,
      cardId: expense.storedValueCardId ?? cardKey,
      cardName: expense.storedValueCardName ?? expense.storedValueCardId ?? cardKey,
      currency: normalizeCurrency(expense.currency ?? "HKD"),
      spend: 0,
      topUp: 0,
      transactionCount: 0,
    };
    const amount = expense.amount;
    if (transactionType === "topup" || transactionType === "refund") {
      current.balance = roundCurrencyAmount(current.balance + amount);
      current.topUp = roundCurrencyAmount(current.topUp + amount);
    } else {
      current.balance = roundCurrencyAmount(current.balance - amount);
      current.spend = roundCurrencyAmount(current.spend + amount);
    }
    current.transactionCount += 1;
    balances.set(balanceKey, current);
  }

  return Array.from(balances.values()).sort((left, right) =>
    left.cardName.localeCompare(right.cardName) || left.currency.localeCompare(right.currency),
  );
}

export function storedValueCardBalanceLabels(balance: StoredValueCardBalance) {
  return {
    balanceLabel: formatMoney(balance.balance, balance.currency),
    spendLabel: formatMoney(balance.spend, balance.currency),
    topUpLabel: formatMoney(balance.topUp, balance.currency),
  };
}
