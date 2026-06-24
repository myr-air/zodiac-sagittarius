import { useI18n } from "@/src/i18n/I18nProvider";
import { ExpenseDialogLayer } from "./components/ExpenseDialogLayer";
import { ExpenseLedgerSection } from "./components/ExpenseLedgerSection";
import { ExpenseMoneySettings } from "./components/ExpenseMoneySettings";
import { ExpenseOverviewPanels } from "./components/ExpenseOverviewPanels";
import { ExpensePageHeader } from "./components/ExpensePageHeader";
import { ExpenseSummaryStats } from "./components/ExpenseSummaryStats";
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

type ExpenseFinanceView = "overview" | "spending" | "balances" | "categories" | "settings";

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
  const financeViews: ExpenseFinanceView[] = ["overview", "spending", "balances", "categories", "settings"];
  const activePanelId = `trip-money-panel-${activeView}`;
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
        locale={locale}
        t={t}
        trip={trip}
      />

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

      {activeView === "overview" ? (
        <div
          className={expenseStyles.financeViewClassName}
          id={activePanelId}
          role="tabpanel"
          aria-labelledby="trip-money-tab-overview"
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
      ) : null}

      {activeView === "spending" ? (
        <div id={activePanelId} role="tabpanel" aria-labelledby="trip-money-tab-spending">
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
            onDeleteExpense={onDeleteExpense}
            onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
            onEditExpense={setDialogExpense}
            onDayFilterChange={setDayFilter}
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
        </div>
      ) : null}

      {activeView === "balances" ? (
        <div id={activePanelId} role="tabpanel" aria-labelledby="trip-money-tab-balances">
          <ExpenseOverviewPanels
            view="balances"
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
      ) : null}

      {activeView === "categories" ? (
        <div id={activePanelId} role="tabpanel" aria-labelledby="trip-money-tab-categories">
          <ExpenseOverviewPanels
            view="categories"
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
      ) : null}

      {activeView === "settings" ? (
        <div id={activePanelId} role="tabpanel" aria-labelledby="trip-money-tab-settings">
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
        </div>
      ) : null}

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
