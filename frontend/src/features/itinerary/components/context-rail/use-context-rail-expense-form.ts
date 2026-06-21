import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { expenseCategoryValues } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";
import type {
  ContextRailCreateExpenseInput,
  ContextRailUpdateExpenseInput,
} from "./context-rail.types";

interface UseContextRailExpenseFormOptions {
  selectedItemId?: string;
  defaultPaidBy: string;
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
}

export const contextRailExpenseCategoryOptions = expenseCategoryValues;

export function useContextRailExpenseForm({
  selectedItemId,
  defaultPaidBy,
  onCreateExpense,
  onUpdateExpense,
}: UseContextRailExpenseFormOptions) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(defaultPaidBy);
  const [expenseCategory, setExpenseCategory] =
    useState<Expense["category"]>("food");

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = expenseTitle.trim();
    const amount = Number(expenseAmount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    if (editingExpenseId) {
      onUpdateExpense({
        expenseId: editingExpenseId,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    } else {
      onCreateExpense({
        itemId: selectedItemId ?? null,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    }
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
  }

  function startEditingExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(String(expense.amount));
    setExpensePaidBy(expense.paidBy);
    setExpenseCategory(expense.category);
  }

  function onAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setExpenseAmount(event.target.value);
  }

  return {
    editingExpenseId,
    expenseAmount,
    expenseCategory,
    expensePaidBy,
    expenseTitle,
    onAmountChange,
    setExpenseCategory,
    setExpensePaidBy,
    setExpenseTitle,
    startEditingExpense,
    submitExpense,
  };
}
