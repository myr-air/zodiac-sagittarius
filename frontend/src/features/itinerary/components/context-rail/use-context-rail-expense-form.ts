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

interface ContextRailExpenseFormValues {
  amount: string;
  category: Expense["category"];
  paidBy: string;
  title: string;
}

export const contextRailExpenseCategoryOptions = expenseCategoryValues;

export function useContextRailExpenseForm({
  selectedItemId,
  defaultPaidBy,
  onCreateExpense,
  onUpdateExpense,
}: UseContextRailExpenseFormOptions) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ContextRailExpenseFormValues>({
    amount: "",
    category: "food",
    paidBy: defaultPaidBy,
    title: "",
  });

  function updateFormValue<Field extends keyof ContextRailExpenseFormValues>(
    field: Field,
    value: ContextRailExpenseFormValues[Field],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = formValues.title.trim();
    const amount = Number(formValues.amount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    if (editingExpenseId) {
      onUpdateExpense({
        expenseId: editingExpenseId,
        title,
        amount,
        paidBy: formValues.paidBy,
        category: formValues.category,
      });
    } else {
      onCreateExpense({
        itemId: selectedItemId ?? null,
        title,
        amount,
        paidBy: formValues.paidBy,
        category: formValues.category,
      });
    }
    setEditingExpenseId(null);
    setFormValues((current) => ({ ...current, amount: "", title: "" }));
  }

  function startEditingExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setFormValues({
      amount: String(expense.amount),
      category: expense.category,
      paidBy: expense.paidBy,
      title: expense.title,
    });
  }

  function onAmountChange(event: ChangeEvent<HTMLInputElement>) {
    updateFormValue("amount", event.target.value);
  }

  return {
    editingExpenseId,
    expenseAmount: formValues.amount,
    expenseCategory: formValues.category,
    expensePaidBy: formValues.paidBy,
    expenseTitle: formValues.title,
    onAmountChange,
    setExpenseCategory: (category: Expense["category"]) =>
      updateFormValue("category", category),
    setExpensePaidBy: (paidBy: string) => updateFormValue("paidBy", paidBy),
    setExpenseTitle: (title: string) => updateFormValue("title", title),
    startEditingExpense,
    submitExpense,
  };
}
