import { useI18n } from "@/src/i18n/I18nProvider";
import { formatMoney } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";
import { expenseItemClassName } from "./context-rail.styles";
import { ContextRailItemActionButtons } from "./ContextRailItemActionButtons";

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
  const { t } = useI18n();

  return (
    <article className={expenseItemClassName}>
      <span>
        <strong>{expense.title}</strong>
        <br />
        {formatMoney(expense.amount, expense.currency ?? "HKD")}
      </span>
      <ContextRailItemActionButtons
        actions={[
          {
            ariaLabel: t.contextRail.expenses.editExpense({
              title: expense.title,
            }),
            disabled: !canEditExpenses,
            icon: "edit",
            onClick: () => onEditExpense(expense),
          },
          {
            ariaLabel: t.contextRail.expenses.deleteExpense({
              title: expense.title,
            }),
            disabled: !canEditExpenses,
            icon: "trash",
            onClick: () => onDeleteExpense(expense.id),
          },
        ]}
      />
    </article>
  );
}
