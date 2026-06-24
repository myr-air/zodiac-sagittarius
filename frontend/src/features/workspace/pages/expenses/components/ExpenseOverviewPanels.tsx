import { WorkspacePanelHeading } from "@/src/shared/components/workspace-panel-heading";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { Expense, ExpenseSummary, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseMemberBalanceDisplay,
  settlementSuggestionDisplay,
} from "../model/expense-overview-display";
import {
  ExpenseCategorySpendSection,
  ExpenseScopeAuditSection,
} from "./ExpenseOverviewSections";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseOverviewPanelsProps {
  trip: Trip;
  expenseSummary: ExpenseSummary;
  categorySpend: Array<[Expense["category"], number]>;
  inferredScopeExpenses: Expense[];
  settlementCurrency: string;
  canEditExpenses: boolean;
  onCopyPaybackReminder: (suggestion: SettlementSuggestion) => void;
  onRecordSettlement: (suggestion: SettlementSuggestion) => void;
  onReviewExpense: (expense: Expense) => void;
}

export function ExpenseOverviewPanels({
  trip,
  expenseSummary,
  categorySpend,
  inferredScopeExpenses,
  settlementCurrency,
  canEditExpenses,
  onCopyPaybackReminder,
  onRecordSettlement,
  onReviewExpense,
}: ExpenseOverviewPanelsProps) {
  const { locale, t } = useI18n();

  return (
    <div className="grid content-start gap-3">
      <section className={expenseStyles.panelClassName} aria-label={t.expenses.balanceLabel}>
        <WorkspacePanelHeading
          className={expenseStyles.panelHeadingClassName}
          icon="users"
          title={t.expenses.panels.balances}
        />
        <div className={expenseStyles.balanceListClassName}>
          {trip.members.map((member) => {
            const net = expenseSummary.netByMember[member.id] ?? 0;
            const balance = expenseMemberBalanceDisplay({
              balanceCopy: t.expenses.balance,
              memberName: member.displayName,
              net,
              settlementCurrency,
            });
            return (
              <div className={expenseStyles.balanceRowClassName} key={member.id}>
                <ExpenseMemberLine
                  color={member.color}
                  name={member.displayName}
                  meta={balance.description}
                />
                <strong
                  className={cn(
                    expenseStyles.amountClassName,
                    balance.tone === "positive" && expenseStyles.positiveClassName,
                    balance.tone === "negative" && expenseStyles.negativeClassName,
                  )}
                >
                  {balance.amountLabel}
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className={expenseStyles.panelClassName} aria-label={t.expenses.panels.settle}>
        <WorkspacePanelHeading
          className={expenseStyles.panelHeadingClassName}
          icon="wallet"
          title={t.expenses.panels.settle}
        />
        {expenseSummary.settlementSuggestions.length ? (
          <div className={expenseStyles.balanceListClassName}>
            {expenseSummary.settlementSuggestions.map((suggestion) => {
              const display = settlementSuggestionDisplay({
                balanceCopy: t.expenses.balance,
                locale,
                members: trip.members,
                reminderCopy: t.expenses.reminders,
                settlementCurrency,
                suggestion,
              });
              return (
                <div className={expenseStyles.settlementRowClassName} key={`${suggestion.from}-${suggestion.to}-${suggestion.amount}`}>
                  <span className={expenseStyles.balanceMetaClassName}>
                    {display.label}
                  </span>
                  {display.lastReminderLabel ? (
                    <span className={expenseStyles.balanceMetaClassName}>
                      {display.lastReminderLabel}
                    </span>
                  ) : null}
                  <span className={expenseStyles.balanceActionsClassName}>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => onCopyPaybackReminder(suggestion)}>
                      <Icon name="copy" /> {t.expenses.actions.copyReminder}
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses} onClick={() => onRecordSettlement(suggestion)}>
                      {t.expenses.actions.saveSettlement}
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={expenseStyles.balanceMetaClassName}>{t.expenses.balance.noPaybacks}</p>
        )}
      </section>

      <ExpenseCategorySpendSection
        categorySpend={categorySpend}
        settlementCurrency={settlementCurrency}
        title={t.expenses.panels.categories}
      />

      <ExpenseScopeAuditSection
        canEditExpenses={canEditExpenses}
        copy={t.expenses.scopeAudit}
        inferredScopeExpenses={inferredScopeExpenses}
        onReviewExpense={onReviewExpense}
        trip={trip}
      />
    </div>
  );
}
