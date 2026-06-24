import type { ExpenseCategoryFilter } from "./expense-page-types";

export interface ExpensePageFilterState {
  categoryFilter: ExpenseCategoryFilter;
  dayFilter: string;
  payerFilter: string;
  query: string;
}

export function initialExpensePageFilterState(): ExpensePageFilterState {
  return {
    categoryFilter: "all",
    dayFilter: "all",
    payerFilter: "all",
    query: "",
  };
}

export function expensePageFilterFieldState<
  Field extends keyof ExpensePageFilterState,
>(
  state: ExpensePageFilterState,
  field: Field,
  value: ExpensePageFilterState[Field],
): ExpensePageFilterState {
  return {
    ...state,
    [field]: value,
  };
}

export function clearedExpensePageFilterState(): ExpensePageFilterState {
  return initialExpensePageFilterState();
}
