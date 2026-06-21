import type { Expense, ExpenseSummary, Member } from "@/src/trip/types";
import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { ContextRailPanelShell } from "./ContextRailPanelShell";
import { formatContextRailExpenseTotals } from "./context-rail-expense-totals";
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
    <ContextRailPanelShell title={title} closeLabel={closeLabel} onClose={onClose}>
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
    </ContextRailPanelShell>
  );
}
