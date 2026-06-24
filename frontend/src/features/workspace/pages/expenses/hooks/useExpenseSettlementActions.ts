import type {
  Expense,
  SettlementSuggestion,
  Trip,
} from "@/src/trip/types";
import { useEffect, useRef, useState } from "react";
import {
  buildRefundExpenseInput,
  buildSettlementExpenseInput,
} from "../model/expense-page-actions";
import type { CreateExpenseHandler } from "../model/expense-page-types";

interface UseExpenseSettlementActionsInput {
  onCreateExpense: CreateExpenseHandler;
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
  trip: Trip;
}

export function useExpenseSettlementActions({
  onCreateExpense,
  selectedTripPlanId,
  settlementCurrency,
  trip,
}: UseExpenseSettlementActionsInput) {
  const recentSettlementKeysRef = useRef(new Set<string>());
  const recentRefundKeysRef = useRef(new Set<string>());
  const cooldownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [pendingRefundExpenseIds, setPendingRefundExpenseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingSettlementKeys, setPendingSettlementKeys] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => () => {
    for (const timer of cooldownTimersRef.current) clearTimeout(timer);
  }, []);

  function releaseRecentKey(store: Set<string>, key: string) {
    const timer = setTimeout(() => {
      store.delete(key);
    }, 1200);
    cooldownTimersRef.current.push(timer);
  }

  async function recordSettlement(suggestion: SettlementSuggestion) {
    const key = settlementSuggestionKey(suggestion, settlementCurrency);
    if (recentSettlementKeysRef.current.has(key)) return;
    recentSettlementKeysRef.current.add(key);
    setPendingSettlementKeys((current) => new Set(current).add(key));
    try {
      await onCreateExpense(buildSettlementExpenseInput({
        members: trip.members,
        selectedTripPlanId,
        settlementCurrency,
        suggestion,
        trip,
      }));
    } finally {
      setPendingSettlementKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      releaseRecentKey(recentSettlementKeysRef.current, key);
    }
  }

  async function recordRefund(expense: Expense) {
    if (recentRefundKeysRef.current.has(expense.id)) return;
    const input = buildRefundExpenseInput({
      expense,
      selectedTripPlanId,
      settlementCurrency,
    });
    if (!input) return;
    recentRefundKeysRef.current.add(expense.id);
    setPendingRefundExpenseIds((current) => new Set(current).add(expense.id));
    try {
      await onCreateExpense(input);
    } finally {
      setPendingRefundExpenseIds((current) => {
        const next = new Set(current);
        next.delete(expense.id);
        return next;
      });
      releaseRecentKey(recentRefundKeysRef.current, expense.id);
    }
  }

  return {
    pendingRefundExpenseIds,
    pendingSettlementKeys,
    recordRefund,
    recordSettlement,
  };
}

export function settlementSuggestionKey(
  suggestion: Pick<SettlementSuggestion, "amount" | "currency" | "from" | "to">,
  settlementCurrency: string,
): string {
  return `${suggestion.from}|${suggestion.to}|${Math.round(suggestion.amount * 100)}|${suggestion.currency ?? settlementCurrency}`;
}
