import { useI18n } from "@/src/i18n/I18nProvider";
import {
  formatMoney,
} from "@/src/trip/expenses";
import type { Expense, ExpenseSummary, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { WorkspaceSummaryStat } from "@/src/features/workspace/components/summary-stat";
import { ExpenseDialog } from "./ExpenseDialog";
import { ExpenseLedgerSection } from "./components/ExpenseLedgerSection";
import { ExpenseOverviewPanels } from "./components/ExpenseOverviewPanels";
import * as expenseStyles from "./TripExpensesPage.styles";
import type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";
import { useTripExpensesPageState } from "./use-trip-expenses-page-state";

export type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";

interface TripExpensesPageProps {
  trip: Trip;
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEditExpenses: boolean;
  selectedTripPlanId?: string | null;
  apiBaseUrl?: string;
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
  onDeleteExpense: (expenseId: string) => void;
  onDuplicateExpenseAsEstimate?: (expense: Expense) => void | Promise<void>;
  onRecordPaybackReminder?: (suggestion: SettlementSuggestion) => void | Promise<void>;
}

export function TripExpensesPage({
  trip,
  currentMember,
  expenseSummary,
  canEditExpenses,
  selectedTripPlanId,
  apiBaseUrl = "",
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onRecordPaybackReminder,
}: TripExpensesPageProps) {
  const { locale, t } = useI18n();
  const {
    categoryFilter,
    categorySpend,
    clearFilters,
    copyPaybackReminder,
    copyState,
    copyStatement,
    createDialogExpense,
    currentNet,
    dialogExpense,
    downloadCsv,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    payerFilter,
    query,
    recordRefund,
    recordSettlement,
    setCategoryFilter,
    setDialogExpense,
    setPayerFilter,
    setQuery,
    settlementCurrency,
    updateDialogExpense,
    youOwe,
  } = useTripExpensesPageState({
    currentMember,
    expenseSummary,
    onCreateExpense,
    onRecordPaybackReminder,
    onUpdateExpense,
    selectedTripPlanId,
    trip,
  });

  return (
    <section className={expenseStyles.expensesPageClassName} aria-label={t.expenses.pageLabel}>
      <PageHeader
        title={t.expenses.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="users" /> {t.dates.memberCount({ count: trip.members.length })}</span>
            <span><Icon name="wallet" /> {canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className={expenseStyles.expensesSummaryClassName} aria-label={t.expenses.summaryLabel} role="region">
        <WorkspaceSummaryStat
          className={expenseStyles.statClassName}
          icon="wallet"
          label={t.expenses.stats.tripSpend}
          value={formatMoney(expenseSummary.groupSpend, settlementCurrency)}
        />
        <WorkspaceSummaryStat
          className={expenseStyles.statClassName}
          icon="check"
          label={t.expenses.stats.yourBalance}
          tone={currentNet < 0 ? "negative" : currentNet > 0 ? "positive" : "neutral"}
          value={expenseSummary.currentUserNetLabel}
          valueToneClassNames={summaryValueToneClassNames}
        />
        <WorkspaceSummaryStat
          className={expenseStyles.statClassName}
          icon="users"
          label={t.expenses.stats.owedToYou}
          tone="positive"
          value={formatMoney(owedToYou, settlementCurrency)}
          valueToneClassNames={summaryValueToneClassNames}
        />
        <WorkspaceSummaryStat
          className={expenseStyles.statClassName}
          icon="warning"
          label={t.expenses.stats.youOwe}
          tone="negative"
          value={formatMoney(youOwe, settlementCurrency)}
          valueToneClassNames={summaryValueToneClassNames}
        />
      </div>

      <div className={expenseStyles.contentGridClassName}>
        <ExpenseOverviewPanels
          trip={trip}
          expenseSummary={expenseSummary}
          categorySpend={categorySpend}
          inferredScopeExpenses={inferredScopeExpenses}
          settlementCurrency={settlementCurrency}
          canEditExpenses={canEditExpenses}
          onCopyPaybackReminder={(suggestion) => void copyPaybackReminder(suggestion)}
          onRecordSettlement={recordSettlement}
          onReviewExpense={setDialogExpense}
        />

        <ExpenseLedgerSection
          canEditExpenses={canEditExpenses}
          categoryFilter={categoryFilter}
          copyState={copyState}
          filteredExpenses={filteredExpenses}
          members={trip.members}
          onAddExpense={() => setDialogExpense("new")}
          onCategoryFilterChange={setCategoryFilter}
          onClearFilters={clearFilters}
          onCopyStatement={() => void copyStatement()}
          onDeleteExpense={onDeleteExpense}
          onDownloadCsv={downloadCsv}
          onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
          onEditExpense={setDialogExpense}
          onPayerFilterChange={setPayerFilter}
          onQueryChange={setQuery}
          onRecordRefund={recordRefund}
          payerFilter={payerFilter}
          query={query}
          settlementCurrency={settlementCurrency}
          t={t}
          trip={trip}
        />
      </div>

      {dialogExpense ? (
        <ExpenseDialog
          expense={dialogExpense === "new" ? null : dialogExpense}
          trip={trip}
          currentMember={currentMember}
          settlementCurrency={settlementCurrency}
          selectedTripPlanId={selectedTripPlanId}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setDialogExpense(null)}
          onCreateExpense={createDialogExpense}
          onUpdateExpense={updateDialogExpense}
        />
      ) : null}
    </section>
  );
}

const summaryValueToneClassNames = {
  positive: expenseStyles.positiveClassName,
  negative: expenseStyles.negativeClassName,
};
