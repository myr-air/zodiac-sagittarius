import type { Expense } from "@/src/trip/types";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  categoryTone,
  type CategoryTone,
} from "../model/expense-page-options";

interface ExpenseCategoryBadgeProps {
  category: Expense["category"];
  tone?: CategoryTone;
}

export function ExpenseCategoryBadge({
  category,
  tone = categoryTone(category),
}: ExpenseCategoryBadgeProps) {
  return (
    <span
      className={expenseStyles.categoryBadgeClassName}
      style={{
        backgroundColor: tone.background,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      <span
        className={expenseStyles.categoryDotClassName}
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      {category}
    </span>
  );
}
