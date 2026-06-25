import { WorkspacePanelHeading } from "@/src/shared/components/workspace-panel-heading";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { ExpenseCopyState } from "../model/expense-page-types";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import {
  expenseAmountInSettlementCurrency,
  isStoredValueFundingExpense,
} from "@/src/trip/expenses";
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
import { ExpenseCopyFeedback } from "./ExpenseCopyFeedback";
import {
  ExpenseCategorySpendSection,
  ExpenseScopeAuditSection,
  ExpenseStoredValueSection,
} from "./ExpenseOverviewSections";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";
import { ExpenseActionDetails } from "./ExpenseActionDetails";
import { ExpenseQuickCapture } from "./ExpenseQuickCapture";
import type { CreateExpenseHandler } from "../model/expense-page-types";

interface ExpenseOverviewPanelsProps {
  view?: "overview" | "balances" | "categories";
  trip: Trip;
  expenseSummary: ExpenseSummary;
  categorySpend: Array<[Expense["category"], number]>;
  currentMember: Trip["members"][number];
  displayCurrency: string;
  displayExchangeRate: number;
  inferredScopeExpenses: Expense[];
  selectedTripPlanId: string;
  settlementCurrency: string;
  canCreateExpenses: boolean;
  canEditExpenses: boolean;
  copyState: ExpenseCopyState;
  onAddExpense?: () => void;
  onAddPersonalExpense: () => void;
  onCreateQuickExpense: CreateExpenseHandler;
  onCopyPaybackReminder: (suggestion: SettlementSuggestion) => void;
  pendingSettlementKeys: Set<string>;
  onRecordSettlement: (suggestion: SettlementSuggestion, options?: { closeStatement?: boolean }) => void;
  onReviewExpense: (expense: Expense) => void;
}

export function ExpenseOverviewPanels({
  view = "overview",
  trip,
  expenseSummary,
  categorySpend,
  currentMember,
  displayCurrency,
  displayExchangeRate,
  inferredScopeExpenses,
  selectedTripPlanId,
  settlementCurrency,
  canCreateExpenses,
  canEditExpenses,
  copyState,
  onAddExpense,
  onAddPersonalExpense,
  onCreateQuickExpense,
  onCopyPaybackReminder,
  pendingSettlementKeys,
  onRecordSettlement,
  onReviewExpense,
}: ExpenseOverviewPanelsProps) {
  const { locale, t } = useI18n();
  const personalOnlySpend = trip.expenses.reduce((sum, expense) => {
    if (isStoredValueFundingExpense(expense)) return sum;
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
      !isStoredValueFundingExpense(expense) && expense.paidBy === currentMember.id
        ? sum + expenseAmountInSettlementCurrency(expense, settlementCurrency)
        : sum,
    0,
  );
  const currentMemberShare = trip.expenses.reduce(
    (sum, expense) => {
      if (isStoredValueFundingExpense(expense)) return sum;
      return sum + expenseAmountInSettlementCurrency({
        ...expense,
        amount: expense.splits[currentMember.id] ?? 0,
      }, settlementCurrency);
    },
    0,
  );
  const personalMoney = (amount: number) =>
    formatSettlementAmountForDisplay(amount, {
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    });
  const showSettle = view === "overview" || view === "balances";
  const showBalances = view === "overview" || view === "balances";
  const showOverviewActions = view === "overview";
  const showPrioritySpend = view === "overview";
  const showStoredValue = view === "overview" || view === "balances";
  const showPersonal = view === "overview" || view === "balances";
  const showCategories = view === "overview" || view === "categories";
  const showScopeAudit = view === "overview" || view === "categories";
  const hasSettlementSuggestions = expenseSummary.settlementSuggestions.length > 0;
  const priorityExpenses = [...trip.expenses]
    .filter((expense) => !isStoredValueFundingExpense(expense))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3)
    .map((expense) => ({
      amountLabel: personalMoney(
        expenseAmountInSettlementCurrency(expense, settlementCurrency),
      ),
      expense,
      linkedItem: findItineraryItemById(trip.itineraryItems, expense.itineraryItemId),
    }));

  return (
    <section className={expenseStyles.overviewRailClassName}>
      {showOverviewActions && !hasSettlementSuggestions ? (
        <section className={expenseStyles.decisionLaneClassName} aria-label={t.expenses.overview.addSpendTitle}>
          <div className={expenseStyles.decisionLaneHeaderClassName}>
            <h2>{t.expenses.overview.addSpendTitle}</h2>
            <p>{t.expenses.overview.addSpendDescription}</p>
          </div>
          <ExpenseQuickCapture
            canCreateExpenses={canCreateExpenses}
            currentMember={currentMember}
            onCreateExpense={onCreateQuickExpense}
            selectedTripPlanId={selectedTripPlanId}
            settlementCurrency={settlementCurrency}
            t={t}
            trip={trip}
          />
          {canEditExpenses ? (
            <div className={expenseStyles.balanceActionsClassName}>
              {onAddExpense ? (
                <Button type="button" variant="ghost" onClick={onAddExpense}>
                  <Icon name="plus" /> {t.expenses.actions.addExpense}
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={onAddPersonalExpense}>
                <Icon name="wallet" /> {t.expenses.actions.addPersonalExpense}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {showSettle ? (
      <section className={hasSettlementSuggestions && showOverviewActions ? expenseStyles.decisionLaneClassName : expenseStyles.panelClassName} aria-label={t.expenses.panels.settle}>
        {hasSettlementSuggestions && showOverviewActions ? (
          <div className={expenseStyles.decisionLaneHeaderClassName}>
            <h2>{t.expenses.overview.settleNowTitle}</h2>
            <p>{t.expenses.overview.settlementNudge({
              count: expenseSummary.settlementSuggestions.length,
            })}</p>
          </div>
        ) : (
          <WorkspacePanelHeading
            className={expenseStyles.panelHeadingClassName}
            icon="wallet"
            title={t.expenses.panels.settle}
          />
        )}
        <ExpenseCopyFeedback copyState={copyState} t={t} />
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
                  <div className={expenseStyles.balanceActionsClassName}>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => onCopyPaybackReminder(suggestion)}>
                      <Icon name="copy" /> {t.expenses.actions.copyReminder}
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses || isPending} onClick={() => void onRecordSettlement(suggestion)}>
                      <Icon name="check" /> {t.expenses.actions.saveSettlement}
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses || isPending} onClick={() => void onRecordSettlement(suggestion, { closeStatement: true })}>
                      <Icon name="check" /> {t.expenses.actions.closeStatement}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={expenseStyles.balanceMetaClassName}>{t.expenses.balance.noPaybacks}</p>
        )}
        {hasSettlementSuggestions && showOverviewActions && onAddExpense ? (
          <Button type="button" variant="ghost" disabled={!canCreateExpenses && !canEditExpenses} onClick={onAddExpense}>
            <Icon name="plus" /> {t.expenses.actions.addExpense}
          </Button>
        ) : null}
      </section>
      ) : null}

      {showOverviewActions && hasSettlementSuggestions ? (
        <section className={expenseStyles.panelClassName} aria-label={t.expenses.overview.addSpendTitle}>
          <div className={expenseStyles.decisionLaneHeaderClassName}>
            <h2>{t.expenses.overview.addSpendTitle}</h2>
            <p>{t.expenses.overview.addSpendDescription}</p>
          </div>
          <ExpenseQuickCapture
            canCreateExpenses={canCreateExpenses}
            currentMember={currentMember}
            onCreateExpense={onCreateQuickExpense}
            selectedTripPlanId={selectedTripPlanId}
            settlementCurrency={settlementCurrency}
            t={t}
            trip={trip}
          />
        </section>
      ) : null}

      {showStoredValue ? (
        <ExpenseStoredValueSection
          copy={t.expenses.storedValue}
          expenses={trip.expenses}
        />
      ) : null}

      {showPrioritySpend ? (
        <section className={expenseStyles.panelClassName} aria-label={t.expenses.overview.priorityTitle}>
          <WorkspacePanelHeading
            className={expenseStyles.panelHeadingClassName}
            icon="list"
            title={t.expenses.overview.priorityTitle}
          />
          <div className={expenseStyles.balanceListClassName}>
            {priorityExpenses.map(({ amountLabel, expense, linkedItem }) => (
              <div className={expenseStyles.balanceRowClassName} key={expense.id}>
                <div className="grid gap-1">
                  <div className={expenseStyles.ledgerTitleLineClassName}>
                    <strong className={expenseStyles.balanceNameClassName}>{expense.title}</strong>
                    <ExpenseCategoryBadge category={expense.category} label={t.expenses.categories[expense.category]} />
                  </div>
                  <span className={expenseStyles.balanceMetaClassName}>
                    {linkedItem?.activity ?? t.expenses.uncategorizedStop}
                  </span>
                </div>
                <strong className={expenseStyles.amountClassName}>{amountLabel}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showBalances ? (
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
      ) : null}

      {showPersonal ? (
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
        <ExpenseActionDetails title={t.expenses.table.actions}>
          <Button type="button" variant="ghost" disabled={!canEditExpenses} onClick={onAddPersonalExpense}>
            <Icon name="plus" /> {t.expenses.actions.addPersonalExpense}
          </Button>
        </ExpenseActionDetails>
      </section>
      ) : null}

      {showCategories ? (
      <ExpenseCategorySpendSection
        categorySpend={categorySpend}
        categoryLabels={t.expenses.categories}
        displayCurrency={displayCurrency}
        displayExchangeRate={displayExchangeRate}
        settlementCurrency={settlementCurrency}
        title={t.expenses.panels.categories}
      />
      ) : null}

      {showScopeAudit ? (
      <ExpenseScopeAuditSection
        canEditExpenses={canEditExpenses}
        copy={t.expenses.scopeAudit}
        inferredScopeExpenses={inferredScopeExpenses}
        onReviewExpense={onReviewExpense}
        trip={trip}
      />
      ) : null}
    </section>
  );
}
