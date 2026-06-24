import {
  expenseCategorySelectOptions,
  expenseCategoryValues,
  expenseSplitModeValues,
  type ExpenseCategorySelectOption,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import {
  buildAllFilterSelectOptions,
  buildSelectOptions,
  type SelectOption,
  withAllFilterValue,
} from "@/src/shared/select-options";
import type { Expense } from "@/src/trip/types";

export type CategoryTone = {
  background: string;
  border: string;
  dot: string;
  text: string;
};

export const expenseCategories = expenseCategoryValues;
export const expenseCategoryFilterValues = withAllFilterValue(expenseCategoryValues);
export type ExpenseCategoryFilter = (typeof expenseCategoryFilterValues)[number];

export const expenseSplitModes = expenseSplitModeValues;

export type ExpenseSelectOption<Value extends string = string> = SelectOption<Value>;

const categoryTones: Record<Expense["category"], CategoryTone> = {
  food: { background: "#fff7ed", border: "#fed7aa", dot: "#f97316", text: "#9a3412" },
  transport: { background: "#eff6ff", border: "#bfdbfe", dot: "#2563eb", text: "#1d4ed8" },
  tickets: { background: "#fdf2f8", border: "#fbcfe8", dot: "#db2777", text: "#9d174d" },
  stay: { background: "#fff8e6", border: "#f8d78f", dot: "#b45309", text: "#92400e" },
  shopping: { background: "#fefce8", border: "#fde68a", dot: "#ca8a04", text: "#854d0e" },
  settlement: { background: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a", text: "#166534" },
};

export function categoryTone(category: Expense["category"]): CategoryTone {
  return categoryTones[category];
}

export { expenseCategorySelectOptions, type ExpenseCategorySelectOption };

export function expenseCategoryFilterSelectOptions(
  allCategoriesLabel: string,
): ExpenseSelectOption<ExpenseCategoryFilter>[] {
  return buildAllFilterSelectOptions(
    expenseCategoryFilterValues,
    allCategoriesLabel,
    (value) => value,
  );
}

export function expenseSplitModeSelectOptions(
  labels: Record<ExpenseSplitMode, string>,
): ExpenseSelectOption<ExpenseSplitMode>[] {
  return buildSelectOptions(expenseSplitModes, (value) => labels[value]);
}
