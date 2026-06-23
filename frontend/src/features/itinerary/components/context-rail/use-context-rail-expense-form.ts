import type { ChangeEvent } from "react";
import { useState } from "react";
import type { Expense } from "@/src/trip/types";
import {
  type ContextRailExpenseFormValues,
  initialContextRailExpenseFormState,
  startContextRailExpenseEdit,
  updateContextRailExpenseFormValue,
} from "./context-rail-expense-form-state";
import type {
  ContextRailCreateExpenseInput,
  ContextRailUpdateExpenseInput,
} from "./context-rail.types";
import { useContextRailExpenseFormActions } from "./use-context-rail-expense-form-actions";

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
  const { submitExpense } = useContextRailExpenseFormActions({
    onCreateExpense,
    onUpdateExpense,
    selectedItemId,
    setState,
    state,
  });

  function updateFormValue<Field extends keyof ContextRailExpenseFormValues>(
    field: Field,
    value: ContextRailExpenseFormValues[Field],
  ) {
    setState((current) =>
      updateContextRailExpenseFormValue(current, field, value),
    );
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
