import { WorkspacePanelHeading } from "@/src/shared/components/workspace-panel-heading";
import type { Expense, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  categorySpendDisplay,
  scopeAuditExpenseDisplay,
} from "../model/expense-overview-display";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";

interface ExpenseCategorySpendSectionProps {
  categorySpend: Array<[Expense["category"], number]>;
  displayCurrency: string;
  displayExchangeRate: number;
  settlementCurrency: string;
  title: string;
}

export function ExpenseCategorySpendSection({
  categorySpend,
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
  title,
}: ExpenseCategorySpendSectionProps) {
  return (
    <section className={expenseStyles.panelClassName} aria-label={title}>
      <WorkspacePanelHeading
        className={expenseStyles.panelHeadingClassName}
        icon="list"
        title={title}
      />
      <div className={expenseStyles.balanceListClassName}>
        {categorySpend.map(([category, amount]) => {
          const display = categorySpendDisplay({
            amount,
            category,
            displayCurrency,
            displayExchangeRate,
            settlementCurrency,
          });
          return (
            <div className={expenseStyles.balanceRowClassName} key={category}>
              <ExpenseCategoryBadge category={display.category} tone={display.tone} />
              <strong className={expenseStyles.amountClassName}>
                {display.amountLabel}
              </strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface ExpenseScopeAuditSectionProps {
  canEditExpenses: boolean;
  copy: {
    inferred: string;
    label: string;
    review(input: { title: string }): string;
    summary(input: { count: number }): string;
    title: string;
  };
  inferredScopeExpenses: Expense[];
  onReviewExpense: (expense: Expense) => void;
  trip: Trip;
}

export function ExpenseScopeAuditSection({
  canEditExpenses,
  copy,
  inferredScopeExpenses,
  onReviewExpense,
  trip,
}: ExpenseScopeAuditSectionProps) {
  if (!inferredScopeExpenses.length) return null;

  return (
    <section className={expenseStyles.panelClassName} aria-label={copy.label}>
      <WorkspacePanelHeading
        className={expenseStyles.panelHeadingClassName}
        icon="warning"
        title={copy.title}
      />
      <p className={expenseStyles.balanceMetaClassName}>{copy.summary({ count: inferredScopeExpenses.length })}</p>
      <div className={expenseStyles.scopeAuditListClassName}>
        {inferredScopeExpenses.map((expense) => {
          const display = scopeAuditExpenseDisplay({ expense, trip });
          return (
            <div className={expenseStyles.scopeAuditRowClassName} key={display.id}>
              <span className="min-w-0">
                <strong className={expenseStyles.balanceNameClassName}>{display.title}</strong>
                <br />
                <span className={expenseStyles.balanceMetaClassName}>
                  {copy.inferred}: {display.tripPlanName}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 px-2 py-1 text-xs"
                disabled={!canEditExpenses}
                onClick={() => onReviewExpense(expense)}
              >
                {copy.review({ title: display.title })}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
