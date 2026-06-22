import { useState } from "react";
import type {
  CreateExpenseHandler,
  ExpenseDialogTarget,
  ExpenseInput,
  ExpenseUpdateInput,
  UpdateExpenseHandler,
} from "../model/expense-page-types";

interface UseExpenseDialogTargetStateArgs {
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
}

export function useExpenseDialogTargetState({
  onCreateExpense,
  onUpdateExpense,
}: UseExpenseDialogTargetStateArgs) {
  const [dialogExpense, setDialogExpense] =
    useState<ExpenseDialogTarget>(null);

  async function createDialogExpense(input: ExpenseInput) {
    await onCreateExpense(input);
    setDialogExpense(null);
  }

  async function updateDialogExpense(input: ExpenseUpdateInput) {
    await onUpdateExpense(input);
    setDialogExpense(null);
  }

  return {
    createDialogExpense,
    dialogExpense,
    setDialogExpense,
    updateDialogExpense,
  };
}
