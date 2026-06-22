import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { ContextRailPanelShell } from "./ContextRailPanelShell";
import { formatExpenseSummaryTotals } from "@/src/trip/expenses";
import type { ContextRailExpensesOnlyPanelProps } from "./context-rail.types";

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
  const expenseTotals = formatExpenseSummaryTotals(
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
