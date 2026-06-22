import type { Expense, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  categorySpendDisplay,
  scopeAuditExpenseDisplay,
} from "../model/expense-overview-display";

interface ExpenseCategorySpendSectionProps {
  categorySpend: Array<[Expense["category"], number]>;
  settlementCurrency: string;
  title: string;
}

export function ExpenseCategorySpendSection({
  categorySpend,
  settlementCurrency,
  title,
}: ExpenseCategorySpendSectionProps) {
  return (
    <section className={expenseStyles.panelClassName} aria-label={title}>
      <h2 className={expenseStyles.panelHeadingClassName}><Icon name="list" /> {title}</h2>
      <div className={expenseStyles.balanceListClassName}>
        {categorySpend.map(([category, amount]) => {
          const display = categorySpendDisplay({
            amount,
            category,
            settlementCurrency,
          });
          return (
            <div className={expenseStyles.balanceRowClassName} key={category}>
              <span className={expenseStyles.categoryBadgeClassName} style={{ backgroundColor: display.tone.background, borderColor: display.tone.border, color: display.tone.text }}>
                <span className={expenseStyles.categoryDotClassName} style={{ backgroundColor: display.tone.dot }} aria-hidden="true" />
                {display.category}
              </span>
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
      <h2 className={expenseStyles.panelHeadingClassName}><Icon name="warning" /> {copy.title}</h2>
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
