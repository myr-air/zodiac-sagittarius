import type { Expense, ExpenseSummary, Member } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { formatContextRailExpenseTotals } from "./context-rail-expense-totals";
import {
  inspectorCloseButtonClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  railInspectorClassName,
} from "./context-rail.styles";
import type {
  ContextRailCreateExpenseInput,
  ContextRailUpdateExpenseInput,
} from "./context-rail.types";

interface ContextRailExpensesOnlyPanelProps {
  canEditExpenses: boolean;
  closeLabel: string;
  expenseSummary: ExpenseSummary;
  expenses: Expense[];
  members: Member[];
  title: string;
  onClose: () => void;
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
}

export function ContextRailExpensesOnlyPanel({
  canEditExpenses,
  closeLabel,
  expenseSummary,
  expenses,
  members,
  title,
  onClose,
  onCreateExpense,
  onDeleteExpense,
  onUpdateExpense,
}: ContextRailExpensesOnlyPanelProps) {
  const expenseTotals = formatContextRailExpenseTotals(
    expenseSummary,
    members.length,
  );

  return (
    <div className={railInspectorClassName}>
      <div className={inspectorTitleClassName}>
        <h2 className={inspectorTitleHeadingClassName}>{title}</h2>
        <button
          className={inspectorCloseButtonClassName}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      <ContextRailExpensesSection
        selectedItemId={undefined}
        expenses={expenses}
        members={members}
        perPerson={expenseTotals.perPerson}
        groupSpend={expenseTotals.groupSpend}
        canEditExpenses={canEditExpenses}
        onCreateExpense={onCreateExpense}
        onUpdateExpense={onUpdateExpense}
        onDeleteExpense={onDeleteExpense}
      />
    </div>
  );
}
