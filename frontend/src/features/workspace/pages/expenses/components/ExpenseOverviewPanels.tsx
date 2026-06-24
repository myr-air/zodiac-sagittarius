import { WorkspacePanelHeading } from "@/src/shared/components/workspace-panel-heading";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { expenseAmountInSettlementCurrency } from "@/src/trip/expenses";
import type { Expense, ExpenseSummary, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import { formatSettlementAmountForDisplay } from "../model/expense-display-currency";
import {
  expenseMemberBalanceDisplay,
  settlementSuggestionDisplay,
} from "../model/expense-overview-display";
import { settlementSuggestionKey } from "../hooks/useExpenseSettlementActions";
import {
  ExpenseCategorySpendSection,
  ExpenseScopeAuditSection,
} from "./ExpenseOverviewSections";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseOverviewPanelsProps {
  trip: Trip;
  expenseSummary: ExpenseSummary;
  categorySpend: Array<[Expense["category"], number]>;
  currentMember: Trip["members"][number];
  displayCurrency: string;
  displayExchangeRate: number;
  inferredScopeExpenses: Expense[];
  settlementCurrency: string;
  canEditExpenses: boolean;
  onAddPersonalExpense: () => void;
  onCopyPaybackReminder: (suggestion: SettlementSuggestion) => void;
  pendingSettlementKeys: Set<string>;
  onRecordSettlement: (suggestion: SettlementSuggestion) => void;
  onReviewExpense: (expense: Expense) => void;
}

export function ExpenseOverviewPanels({
  trip,
  expenseSummary,
  categorySpend,
  currentMember,
  displayCurrency,
  displayExchangeRate,
  inferredScopeExpenses,
  settlementCurrency,
  canEditExpenses,
  onAddPersonalExpense,
  onCopyPaybackReminder,
  pendingSettlementKeys,
  onRecordSettlement,
  onReviewExpense,
}: ExpenseOverviewPanelsProps) {
  const { locale, t } = useI18n();
  const personalOnlySpend = trip.expenses.reduce((sum, expense) => {
    const splitEntries = Object.entries(expense.splits);
    const isPersonal =
      expense.paidBy === currentMember.id &&
      splitEntries.length === 1 &&
      splitEntries[0]?.[0] === currentMember.id;
    return isPersonal
      ? sum + expenseAmountInSettlementCurrency(expense, settlementCurrency)
      : sum;
  }, 0);
  const currentMemberPaid = trip.expenses.reduce(
    (sum, expense) =>
      expense.paidBy === currentMember.id
        ? sum + expenseAmountInSettlementCurrency(expense, settlementCurrency)
        : sum,
    0,
  );
  const currentMemberShare = trip.expenses.reduce(
    (sum, expense) =>
      sum + expenseAmountInSettlementCurrency({
        ...expense,
        amount: expense.splits[currentMember.id] ?? 0,
      }, settlementCurrency),
    0,
  );
  const personalMoney = (amount: number) =>
    formatSettlementAmountForDisplay(amount, {
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    });

  return (
    <aside className={expenseStyles.overviewRailClassName} aria-label={t.expenses.summaryLabel}>
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
                displayCurrency,
                displayExchangeRate,
                settlementCurrency,
                suggestion,
              });
              const isPending = pendingSettlementKeys.has(
                settlementSuggestionKey(suggestion, settlementCurrency),
              );
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
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses || isPending} onClick={() => void onRecordSettlement(suggestion)}>
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
              displayCurrency,
              displayExchangeRate,
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

      <section className={expenseStyles.panelClassName} aria-label={t.expenses.personal.label}>
        <WorkspacePanelHeading
          className={expenseStyles.panelHeadingClassName}
          icon="wallet"
          title={t.expenses.panels.personal}
        />
        <div className={expenseStyles.balanceListClassName}>
          <div className={expenseStyles.personalMetricRowClassName}>
            <span>{t.expenses.personal.personalOnly}</span>
            <strong>{personalMoney(personalOnlySpend)}</strong>
          </div>
          <div className={expenseStyles.personalMetricRowClassName}>
            <span>{t.expenses.personal.youPaid}</span>
            <strong>{personalMoney(currentMemberPaid)}</strong>
          </div>
          <div className={expenseStyles.personalMetricRowClassName}>
            <span>{t.expenses.personal.yourShare}</span>
            <strong>{personalMoney(currentMemberShare)}</strong>
          </div>
        </div>
        <Button type="button" disabled={!canEditExpenses} onClick={onAddPersonalExpense}>
          <Icon name="plus" /> {t.expenses.actions.addPersonalExpense}
        </Button>
      </section>

      <ExpenseCategorySpendSection
        categorySpend={categorySpend}
        displayCurrency={displayCurrency}
        displayExchangeRate={displayExchangeRate}
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
    </aside>
  );
}
