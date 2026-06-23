import { useI18n } from "@/src/i18n/I18nProvider";
import { ExpenseDialog } from "./components/ExpenseDialog";
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
      <ExpensePageHeader
        canEditExpenses={canEditExpenses}
        locale={locale}
        t={t}
        trip={trip}
      />

      <ExpenseSummaryStats
        currentNet={currentNet}
        expenseSummary={expenseSummary}
        owedToYou={owedToYou}
        settlementCurrency={settlementCurrency}
        t={t}
        youOwe={youOwe}
      />

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
