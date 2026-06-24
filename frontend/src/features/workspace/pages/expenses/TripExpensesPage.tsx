import { useI18n } from "@/src/i18n/I18nProvider";
import { ExpenseDialogLayer } from "./components/ExpenseDialogLayer";
import { ExpenseLedgerSection } from "./components/ExpenseLedgerSection";
import { ExpenseOverviewPanels } from "./components/ExpenseOverviewPanels";
import { ExpensePageHeader } from "./components/ExpensePageHeader";
import { ExpenseSummaryStats } from "./components/ExpenseSummaryStats";
import * as expenseStyles from "./TripExpensesPage.styles";
import type { TripExpensesPageProps } from "./model/expense-page-types";
import { useTripExpensesPageState } from "./hooks/use-trip-expenses-page-state";

export type {
  CreateExpenseHandler,
  DeleteExpenseHandler,
  DuplicateExpenseAsEstimateHandler,
  ExpenseInput,
  ExpenseUpdateInput,
  RecordPaybackReminderHandler,
  TripExpensesPageProps,
  UpdateExpenseHandler,
} from "./model/expense-page-types";

export function TripExpensesPage({
  trip,
  currentMember,
  expenseSummary,
  canEditExpenses,
  selectedTripPlanId,
  workspaceTrip,
  apiBaseUrl = "",
  onChangeTripPlan,
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
    dayFilter,
    displayCurrency,
    displayExchangeRate,
    displayExchangeRateNumber,
    dialogExpense,
    downloadCsv,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    pendingRefundExpenseIds,
    pendingSettlementKeys,
    payerFilter,
    query,
    recordRefund,
    recordSettlement,
    setCategoryFilter,
    setDayFilter,
    setDialogExpense,
    setDisplayCurrency,
    setDisplayExchangeRate,
    setPayerFilter,
    setQuery,
    settlementCurrency,
    updateDialogExpense,
    youOwe,
  } = useTripExpensesPageState({
    apiBaseUrl,
    currentMember,
    expenseSummary,
    onCreateExpense,
    onRecordPaybackReminder,
    onUpdateExpense,
    selectedTripPlanId,
    trip,
  });
  const planSourceTrip = workspaceTrip ?? trip;
  const activeTripPlanId =
    selectedTripPlanId ?? planSourceTrip.mainTripPlanId ?? planSourceTrip.activePlanVariantId ?? "";

  return (
    <section className={expenseStyles.expensesPageClassName} aria-label={t.expenses.pageLabel}>
      <ExpensePageHeader
        canEditExpenses={canEditExpenses}
        locale={locale}
        t={t}
        trip={trip}
      />

      <ExpenseSummaryStats
        currentNet={currentNet}
        displayCurrency={displayCurrency}
        displayExchangeRate={displayExchangeRateNumber}
        expenseSummary={expenseSummary}
        owedToYou={owedToYou}
        settlementCurrency={settlementCurrency}
        t={t}
        youOwe={youOwe}
      />

      <div className={expenseStyles.contentGridClassName}>
        <ExpenseLedgerSection
          canEditExpenses={canEditExpenses}
          categoryFilter={categoryFilter}
          copyState={copyState}
          dayFilter={dayFilter}
          displayCurrency={displayCurrency}
          displayExchangeRate={displayExchangeRate}
          displayExchangeRateNumber={displayExchangeRateNumber}
          filteredExpenses={filteredExpenses}
          members={trip.members}
          onAddExpense={() => setDialogExpense("new")}
          onAddPersonalExpense={() => setDialogExpense("new-personal")}
          onCategoryFilterChange={setCategoryFilter}
          onClearFilters={clearFilters}
          onCopyStatement={() => void copyStatement()}
          onDeleteExpense={onDeleteExpense}
          onDownloadCsv={downloadCsv}
          onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
          onEditExpense={setDialogExpense}
          onDayFilterChange={setDayFilter}
          onDisplayCurrencyChange={setDisplayCurrency}
          onDisplayExchangeRateChange={setDisplayExchangeRate}
          onPayerFilterChange={setPayerFilter}
          onQueryChange={setQuery}
          onRecordRefund={recordRefund}
          pendingRefundExpenseIds={pendingRefundExpenseIds}
          payerFilter={payerFilter}
          query={query}
          selectedTripPlanId={activeTripPlanId}
          settlementCurrency={settlementCurrency}
          t={t}
          trip={trip}
          workspaceTrip={planSourceTrip}
          onTripPlanChange={onChangeTripPlan}
        />

        <ExpenseOverviewPanels
          trip={trip}
          expenseSummary={expenseSummary}
          categorySpend={categorySpend}
          currentMember={currentMember}
          displayCurrency={displayCurrency}
          displayExchangeRate={displayExchangeRateNumber}
          inferredScopeExpenses={inferredScopeExpenses}
          settlementCurrency={settlementCurrency}
          canEditExpenses={canEditExpenses}
          onAddPersonalExpense={() => setDialogExpense("new-personal")}
          onCopyPaybackReminder={(suggestion) => void copyPaybackReminder(suggestion)}
          pendingSettlementKeys={pendingSettlementKeys}
          onRecordSettlement={recordSettlement}
          onReviewExpense={setDialogExpense}
        />
      </div>

      <ExpenseDialogLayer
        apiBaseUrl={apiBaseUrl}
        currentMember={currentMember}
        dialogExpense={dialogExpense}
        selectedTripPlanId={selectedTripPlanId}
        settlementCurrency={settlementCurrency}
        trip={trip}
        onClose={() => setDialogExpense(null)}
        onCreateExpense={createDialogExpense}
        onUpdateExpense={updateDialogExpense}
      />
    </section>
  );
}
