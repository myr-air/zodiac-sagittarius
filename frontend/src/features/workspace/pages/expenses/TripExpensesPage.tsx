import { useI18n } from "@/src/i18n/I18nProvider";
import { ExpenseDialogLayer } from "./components/ExpenseDialogLayer";
import { ExpenseLedgerSection } from "./components/ExpenseLedgerSection";
import { ExpenseMoneySettings } from "./components/ExpenseMoneySettings";
import { ExpenseOverviewPanels } from "./components/ExpenseOverviewPanels";
import { ExpensePageHeader, ExpenseTripPlanPicker } from "./components/ExpensePageHeader";
import { ExpenseStatementSection } from "./components/ExpenseStatementSection";
import { ExpenseSummaryStats } from "./components/ExpenseSummaryStats";
import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";
import { defaultTripPlanId } from "@/src/trip/trip-plans";
import * as expenseStyles from "./TripExpensesPage.styles";
import type { TripExpensesPageProps } from "./model/expense-page-types";
import { useTripExpensesPageState } from "./hooks/use-trip-expenses-page-state";
import { type KeyboardEvent, useState } from "react";

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

type ExpenseFinanceView = "overview" | "spending" | "account";

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
  const [activeView, setActiveView] = useState<ExpenseFinanceView>("overview");
  const [pendingDeleteExpenseId, setPendingDeleteExpenseId] = useState<string | null>(null);
  const planSourceTrip = workspaceTrip ?? trip;
  const activeTripPlanId = selectedTripPlanId || defaultTripPlanId(planSourceTrip);
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
    selectedTripPlanId: activeTripPlanId,
    trip,
  });
  const pendingDeleteExpense = trip.expenses.find((expense) => expense.id === pendingDeleteExpenseId) ?? null;
  const financeViews: ExpenseFinanceView[] = ["overview", "spending", "account"];
  const focusFinanceTab = (view: ExpenseFinanceView) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`trip-money-tab-${view}`)?.focus();
    });
  };
  const onFinanceTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, view: ExpenseFinanceView) => {
    const currentIndex = financeViews.indexOf(view);
    const nextView =
      event.key === "ArrowRight"
        ? financeViews[(currentIndex + 1) % financeViews.length]
        : event.key === "ArrowLeft"
          ? financeViews[(currentIndex - 1 + financeViews.length) % financeViews.length]
          : event.key === "Home"
            ? financeViews[0]
            : event.key === "End"
              ? financeViews[financeViews.length - 1]
              : null;
    if (!nextView) return;
    event.preventDefault();
    setActiveView(nextView);
    focusFinanceTab(nextView);
  };

  return (
    <section className={expenseStyles.expensesPageClassName} aria-label={t.expenses.pageLabel}>
      <ExpensePageHeader
        canEditExpenses={canEditExpenses}
        currentTripPlanId={activeTripPlanId}
        locale={locale}
        onTripPlanChange={onChangeTripPlan}
        t={t}
        trip={planSourceTrip}
      />
      <div className={expenseStyles.mobilePlanBarClassName}>
        <ExpenseTripPlanPicker
          currentTripPlanId={activeTripPlanId}
          label={t.expenses.fields.tripPlan}
          tripPlanOptions={planSourceTrip.tripPlans ?? planSourceTrip.planVariants}
          onTripPlanChange={onChangeTripPlan}
        />
      </div>

      <nav
        className={expenseStyles.financeTabsClassName}
        aria-label={t.expenses.tabs.label}
        role="tablist"
      >
        {financeViews.map((view) => (
          <button
            type="button"
            aria-controls={`trip-money-panel-${view}`}
            aria-selected={activeView === view}
            className={activeView === view ? expenseStyles.financeTabActiveClassName : expenseStyles.financeTabClassName}
            key={view}
            id={`trip-money-tab-${view}`}
            role="tab"
            tabIndex={activeView === view ? 0 : -1}
            onClick={() => setActiveView(view)}
            onKeyDown={(event) => onFinanceTabKeyDown(event, view)}
          >
            {t.expenses.tabs[view]}
          </button>
        ))}
      </nav>

      <div
        className={expenseStyles.financeViewClassName}
        id="trip-money-panel-overview"
        role="tabpanel"
        aria-labelledby="trip-money-tab-overview"
        hidden={activeView !== "overview"}
      >
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
          <ExpenseOverviewPanels
            view="overview"
            trip={trip}
            expenseSummary={expenseSummary}
            categorySpend={categorySpend}
            currentMember={currentMember}
            displayCurrency={displayCurrency}
            displayExchangeRate={displayExchangeRateNumber}
            inferredScopeExpenses={inferredScopeExpenses}
            settlementCurrency={settlementCurrency}
            canEditExpenses={canEditExpenses}
            copyState={copyState}
            onAddExpense={() => setDialogExpense("new")}
            onAddPersonalExpense={() => setDialogExpense("new-personal")}
            onCopyPaybackReminder={(suggestion) => void copyPaybackReminder(suggestion)}
            pendingSettlementKeys={pendingSettlementKeys}
            onRecordSettlement={recordSettlement}
            onReviewExpense={setDialogExpense}
          />
      </div>

      <div
        id="trip-money-panel-spending"
        role="tabpanel"
        aria-labelledby="trip-money-tab-spending"
        hidden={activeView !== "spending"}
      >
          <ExpenseLedgerSection
            canEditExpenses={canEditExpenses}
            categoryFilter={categoryFilter}
            dayFilter={dayFilter}
            displayCurrency={displayCurrency}
            displayExchangeRateNumber={displayExchangeRateNumber}
            filteredExpenses={filteredExpenses}
            members={trip.members}
            onAddExpense={() => setDialogExpense("new")}
            onAddPersonalExpense={() => setDialogExpense("new-personal")}
            onCategoryFilterChange={setCategoryFilter}
            onClearFilters={clearFilters}
            onDeleteExpense={setPendingDeleteExpenseId}
            onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
            onEditExpense={setDialogExpense}
            onDayFilterChange={setDayFilter}
            onPayerFilterChange={setPayerFilter}
            onQueryChange={setQuery}
            onRecordRefund={recordRefund}
            pendingRefundExpenseIds={pendingRefundExpenseIds}
            payerFilter={payerFilter}
            query={query}
            settlementCurrency={settlementCurrency}
            t={t}
            trip={trip}
          />
      </div>

      <div
        id="trip-money-panel-account"
        role="tabpanel"
        aria-labelledby="trip-money-tab-account"
        hidden={activeView !== "account"}
      >
        <div className={expenseStyles.financeViewClassName}>
          <ExpenseMoneySettings
            copyState={copyState}
            displayCurrency={displayCurrency}
            displayExchangeRate={displayExchangeRate}
            settlementCurrency={settlementCurrency}
            t={t}
            onCopyStatement={() => void copyStatement()}
            onDisplayCurrencyChange={setDisplayCurrency}
            onDisplayExchangeRateChange={setDisplayExchangeRate}
            onDownloadCsv={downloadCsv}
          />
          <ExpenseStatementSection
            currentMember={currentMember}
            displayCurrency={displayCurrency}
            displayExchangeRateNumber={displayExchangeRateNumber}
            locale={locale}
            settlementCurrency={settlementCurrency}
            t={t}
            trip={trip}
          />
        </div>
      </div>

      <ExpenseDialogLayer
        apiBaseUrl={apiBaseUrl}
        currentMember={currentMember}
        dialogExpense={dialogExpense}
        selectedTripPlanId={activeTripPlanId}
        settlementCurrency={settlementCurrency}
        trip={trip}
        onClose={() => setDialogExpense(null)}
        onCreateExpense={createDialogExpense}
        onUpdateExpense={updateDialogExpense}
      />
      {pendingDeleteExpense ? (
        <WorkspaceConfirmDialog
          body={t.expenses.actions.confirmDeleteExpenseBody({ title: pendingDeleteExpense.title })}
          cancelLabel={t.common.actions.cancel}
          confirmLabel={t.expenses.actions.confirmDeleteExpense}
          onCancel={() => setPendingDeleteExpenseId(null)}
          onConfirm={() => {
            onDeleteExpense(pendingDeleteExpense.id);
            setPendingDeleteExpenseId(null);
          }}
          title={t.expenses.actions.confirmDeleteExpense}
          titleTone="danger"
        />
      ) : null}
    </section>
  );
}
