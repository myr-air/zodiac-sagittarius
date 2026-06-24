import { useState } from "react";
import {
  clearedExpensePageFilterState,
  expensePageFilterFieldState,
  initialExpensePageFilterState,
  type ExpensePageFilterState,
} from "../model/expense-page-filter-state";

export function useExpensePageFilters() {
  const [filterState, setFilterState] = useState(initialExpensePageFilterState);

  function clearFilters() {
    setFilterState(clearedExpensePageFilterState());
  }

  function updateFilterField<Field extends keyof ExpensePageFilterState>(
    field: Field,
    value: ExpensePageFilterState[Field],
  ) {
    setFilterState((current) =>
      expensePageFilterFieldState(current, field, value),
    );
  }

  return {
    categoryFilter: filterState.categoryFilter,
    clearFilters,
    dayFilter: filterState.dayFilter,
    payerFilter: filterState.payerFilter,
    query: filterState.query,
    setCategoryFilter: (
      categoryFilter: ExpensePageFilterState["categoryFilter"],
    ) =>
      updateFilterField("categoryFilter", categoryFilter),
    setDayFilter: (dayFilter: string) =>
      updateFilterField("dayFilter", dayFilter),
    setPayerFilter: (payerFilter: string) =>
      updateFilterField("payerFilter", payerFilter),
    setQuery: (query: string) => updateFilterField("query", query),
  };
}
