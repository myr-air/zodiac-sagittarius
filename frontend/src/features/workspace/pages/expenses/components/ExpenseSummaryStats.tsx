import type { ExpenseSummary } from "@/src/trip/types";
import { WorkspaceSummaryStat } from "@/src/shared/components/workspace-summary-stat";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseSummaryDisplay } from "../model/expense-summary-display";
import type { ExpensePageLabels } from "../model/expense-page-types";

interface ExpenseSummaryStatsProps {
  currentNet: number;
  expenseSummary: ExpenseSummary;
  owedToYou: number;
  settlementCurrency: string;
  t: ExpensePageLabels;
  youOwe: number;
}

const summaryValueToneClassNames = {
  positive: expenseStyles.positiveClassName,
  negative: expenseStyles.negativeClassName,
};

export function ExpenseSummaryStats({
  currentNet,
  expenseSummary,
  owedToYou,
  settlementCurrency,
  t,
  youOwe,
}: ExpenseSummaryStatsProps) {
  const display = expenseSummaryDisplay({
    currentNet,
    expenseSummary,
    owedToYou,
    settlementCurrency,
    youOwe,
  });

  return (
    <div className={expenseStyles.expensesSummaryClassName} aria-label={t.expenses.summaryLabel} role="region">
      <WorkspaceSummaryStat
        className={expenseStyles.statClassName}
        icon="wallet"
        label={t.expenses.stats.tripSpend}
        value={display.groupSpendLabel}
      />
      <WorkspaceSummaryStat
        className={expenseStyles.statClassName}
        icon="check"
        label={t.expenses.stats.yourBalance}
        tone={display.currentNetTone}
        value={expenseSummary.currentUserNetLabel}
        valueToneClassNames={summaryValueToneClassNames}
      />
      <WorkspaceSummaryStat
        className={expenseStyles.statClassName}
        icon="users"
        label={t.expenses.stats.owedToYou}
        tone="positive"
        value={display.owedToYouLabel}
        valueToneClassNames={summaryValueToneClassNames}
      />
      <WorkspaceSummaryStat
        className={expenseStyles.statClassName}
        icon="warning"
        label={t.expenses.stats.youOwe}
        tone="negative"
        value={display.youOweLabel}
        valueToneClassNames={summaryValueToneClassNames}
      />
    </div>
  );
}
