import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { memberInitial } from "@/src/trip/members";
import type { Expense, ExpenseSummary, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  categorySpendDisplay,
  expenseMemberBalanceDisplay,
  settlementSuggestionDisplay,
  scopeAuditExpenseDisplay,
} from "../model/expense-overview-display";

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
        <h2 className={expenseStyles.panelHeadingClassName}><Icon name="users" /> {t.expenses.panels.balances}</h2>
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
                <span className={expenseStyles.memberLineClassName}>
                  <span className={expenseStyles.avatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">{memberInitial(member.displayName)}</span>
                  <span className="min-w-0">
                    <span className={expenseStyles.balanceNameClassName}>{member.displayName}</span>
                    <br />
                    <span className={expenseStyles.balanceMetaClassName}>
                      {balance.description}
                    </span>
                  </span>
                </span>
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
        <h2 className={expenseStyles.panelHeadingClassName}><Icon name="wallet" /> {t.expenses.panels.settle}</h2>
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

      <section className={expenseStyles.panelClassName} aria-label={t.expenses.panels.categories}>
        <h2 className={expenseStyles.panelHeadingClassName}><Icon name="list" /> {t.expenses.panels.categories}</h2>
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

      {inferredScopeExpenses.length ? (
        <section className={expenseStyles.panelClassName} aria-label={t.expenses.scopeAudit.label}>
          <h2 className={expenseStyles.panelHeadingClassName}><Icon name="warning" /> {t.expenses.scopeAudit.title}</h2>
          <p className={expenseStyles.balanceMetaClassName}>{t.expenses.scopeAudit.summary({ count: inferredScopeExpenses.length })}</p>
          <div className={expenseStyles.scopeAuditListClassName}>
            {inferredScopeExpenses.map((expense) => {
              const display = scopeAuditExpenseDisplay({ expense, trip });
              return (
                <div className={expenseStyles.scopeAuditRowClassName} key={display.id}>
                  <span className="min-w-0">
                    <strong className={expenseStyles.balanceNameClassName}>{display.title}</strong>
                    <br />
                    <span className={expenseStyles.balanceMetaClassName}>
                      {t.expenses.scopeAudit.inferred}: {display.tripPlanName}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 px-2 py-1 text-xs"
                    disabled={!canEditExpenses}
                    onClick={() => onReviewExpense(expense)}
                  >
                    {t.expenses.scopeAudit.review({ title: display.title })}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
