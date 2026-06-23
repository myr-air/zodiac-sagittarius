import { expenseCategoryValues } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";

export interface ContextRailExpenseFormValues {
  amount: string;
  category: Expense["category"];
  paidBy: string;
  title: string;
}

export interface ContextRailExpenseFormState {
  editingExpenseId: string | null;
  formValues: ContextRailExpenseFormValues;
}

export interface ContextRailExpenseSubmission {
  amount: number;
  category: Expense["category"];
  expenseId: string | null;
  paidBy: string;
  title: string;
}

export const contextRailExpenseCategoryOptions = expenseCategoryValues;

export function initialContextRailExpenseFormState(
  defaultPaidBy: string,
): ContextRailExpenseFormState {
  return {
    editingExpenseId: null,
    formValues: {
      amount: "",
      category: "food",
      paidBy: defaultPaidBy,
      title: "",
    },
  };
}

export function updateContextRailExpenseFormValue<
  Field extends keyof ContextRailExpenseFormValues,
>(
  state: ContextRailExpenseFormState,
  field: Field,
  value: ContextRailExpenseFormValues[Field],
): ContextRailExpenseFormState {
  return {
    ...state,
    formValues: {
      ...state.formValues,
      [field]: value,
    },
  };
}

export function startContextRailExpenseEdit(
  expense: Expense,
): ContextRailExpenseFormState {
  return {
    editingExpenseId: expense.id,
    formValues: {
      amount: String(expense.amount),
      category: expense.category,
      paidBy: expense.paidBy,
      title: expense.title,
    },
  };
}

export function resetContextRailExpenseFormAfterSubmit(
  state: ContextRailExpenseFormState,
): ContextRailExpenseFormState {
  return {
    ...state,
    editingExpenseId: null,
    formValues: {
      ...state.formValues,
      amount: "",
      title: "",
    },
  };
}

export function buildContextRailExpenseSubmission(
  state: ContextRailExpenseFormState,
): ContextRailExpenseSubmission | null {
  const title = state.formValues.title.trim();
  const amount = Number(state.formValues.amount);
  if (!title || !Number.isFinite(amount) || amount < 0) return null;
  return {
    amount,
    category: state.formValues.category,
    expenseId: state.editingExpenseId,
    paidBy: state.formValues.paidBy,
    title,
  };
}
