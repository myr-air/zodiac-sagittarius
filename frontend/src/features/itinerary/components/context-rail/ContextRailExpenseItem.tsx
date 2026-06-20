import { Icon } from "@/src/ui/icons";
import type { Expense } from "@/src/trip/types";
import {
  expenseItemClassName,
  noteActionButtonClassName,
  noteActionsClassName,
} from "./context-rail.styles";

interface ContextRailExpenseItemProps {
  expense: Expense;
  canEditExpenses: boolean;
  onDeleteExpense: (expenseId: string) => void;
  onEditExpense: (expense: Expense) => void;
}

export function ContextRailExpenseItem({
  expense,
  canEditExpenses,
  onDeleteExpense,
  onEditExpense,
}: ContextRailExpenseItemProps) {
  return (
    <article className={expenseItemClassName}>
      <span>
        <strong>{expense.title}</strong>
        <br />
        HK${expense.amount.toLocaleString("en-HK")}
      </span>
      <span className={noteActionsClassName}>
        <button
          className={noteActionButtonClassName}
          type="button"
          aria-label={`Edit expense ${expense.title}`}
          disabled={!canEditExpenses}
          onClick={() => onEditExpense(expense)}
        >
          <Icon name="edit" />
        </button>
        <button
          className={noteActionButtonClassName}
          type="button"
          aria-label={`Delete expense ${expense.title}`}
          disabled={!canEditExpenses}
          onClick={() => onDeleteExpense(expense.id)}
        >
          <Icon name="trash" />
        </button>
      </span>
    </article>
  );
}
