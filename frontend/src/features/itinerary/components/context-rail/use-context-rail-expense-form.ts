import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { Expense } from "@/src/trip/types";
import {
  type ContextRailExpenseFormValues,
  initialContextRailExpenseFormState,
  resetContextRailExpenseFormAfterSubmit,
  startContextRailExpenseEdit,
  updateContextRailExpenseFormValue,
} from "./context-rail-expense-form-state";
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

export function useContextRailExpenseForm({
  selectedItemId,
  defaultPaidBy,
  onCreateExpense,
  onUpdateExpense,
}: UseContextRailExpenseFormOptions) {
  const [state, setState] = useState(() =>
    initialContextRailExpenseFormState(defaultPaidBy),
  );

  function updateFormValue<Field extends keyof ContextRailExpenseFormValues>(
    field: Field,
    value: ContextRailExpenseFormValues[Field],
  ) {
    setState((current) =>
      updateContextRailExpenseFormValue(current, field, value),
    );
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = state.formValues.title.trim();
    const amount = Number(state.formValues.amount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    if (state.editingExpenseId) {
      onUpdateExpense({
        expenseId: state.editingExpenseId,
        title,
        amount,
        paidBy: state.formValues.paidBy,
        category: state.formValues.category,
      });
    } else {
      onCreateExpense({
        itemId: selectedItemId ?? null,
        title,
        amount,
        paidBy: state.formValues.paidBy,
        category: state.formValues.category,
      });
    }
    setState((current) => resetContextRailExpenseFormAfterSubmit(current));
  }

  function startEditingExpense(expense: Expense) {
    setState(startContextRailExpenseEdit(expense));
  }

  function onAmountChange(event: ChangeEvent<HTMLInputElement>) {
    updateFormValue("amount", event.target.value);
  }

  return {
    editingExpenseId: state.editingExpenseId,
    expenseAmount: state.formValues.amount,
    expenseCategory: state.formValues.category,
    expensePaidBy: state.formValues.paidBy,
    expenseTitle: state.formValues.title,
    onAmountChange,
    setExpenseCategory: (category: Expense["category"]) =>
      updateFormValue("category", category),
    setExpensePaidBy: (paidBy: string) => updateFormValue("paidBy", paidBy),
    setExpenseTitle: (title: string) => updateFormValue("title", title),
    startEditingExpense,
    submitExpense,
  };
}
