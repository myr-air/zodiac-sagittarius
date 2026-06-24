import type { Expense, Member, Trip } from "@/src/trip/types";
import { useEffect, useState } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseDayFilterOptions,
  expenseLedgerDayGroups,
} from "../model/expense-page-filters";
import type {
  DuplicateExpenseAsEstimateHandler,
  ExpenseCategoryFilter,
  ExpenseCopyState,
} from "../model/expense-page-types";
import { ExpenseLedgerControls } from "./ExpenseLedgerControls";
import { ExpenseLedgerRows } from "./ExpenseLedgerRows";
import { ExpenseMobileLedgerList } from "./ExpenseMobileLedgerList";

interface ExpenseLedgerSectionProps {
  canEditExpenses: boolean;
  categoryFilter: ExpenseCategoryFilter;
  copyState: ExpenseCopyState;
  dayFilter: string;
  displayCurrency: string;
  displayExchangeRate: string;
  displayExchangeRateNumber: number;
  filteredExpenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  onAddPersonalExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onCopyStatement: () => void;
  onDayFilterChange: (day: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDisplayCurrencyChange: (currency: string) => void;
  onDisplayExchangeRateChange: (rate: string) => void;
  onDownloadCsv: () => void;
  onDuplicateExpenseAsEstimate?: DuplicateExpenseAsEstimateHandler;
  onEditExpense: (expense: Expense) => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
  onRecordRefund: (expense: Expense) => void;
  pendingRefundExpenseIds: Set<string>;
  payerFilter: string;
  query: string;
  selectedTripPlanId: string;
  settlementCurrency: string;
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  trip: Trip;
  workspaceTrip: Trip;
  onTripPlanChange?: (tripPlanId: string) => void;
}

export function ExpenseLedgerSection({
  canEditExpenses,
  categoryFilter,
  copyState,
  dayFilter,
  displayCurrency,
  displayExchangeRate,
  displayExchangeRateNumber,
  filteredExpenses,
  members,
  onAddExpense,
  onAddPersonalExpense,
  onCategoryFilterChange,
  onClearFilters,
  onCopyStatement,
  onDayFilterChange,
  onDeleteExpense,
  onDisplayCurrencyChange,
  onDisplayExchangeRateChange,
  onDownloadCsv,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onPayerFilterChange,
  onQueryChange,
  onRecordRefund,
  pendingRefundExpenseIds,
  payerFilter,
  query,
  selectedTripPlanId,
  settlementCurrency,
  t,
  trip,
  workspaceTrip,
  onTripPlanChange,
}: ExpenseLedgerSectionProps) {
  const isMobileLedger = useIsMobileLedger();
  const dayGroups = expenseLedgerDayGroups({
    displayCurrency,
    displayExchangeRate: displayExchangeRateNumber,
    expenses: filteredExpenses,
    itineraryItems: trip.itineraryItems,
    settlementCurrency,
    unlinkedLabel: t.expenses.filters.unlinkedDay,
  });
  return (
    <section className={expenseStyles.ledgerSectionClassName} aria-label={t.expenses.ledgerLabel}>
      <ExpenseLedgerControls
        canEditExpenses={canEditExpenses}
        categoryFilter={categoryFilter}
        copyState={copyState}
        dayFilter={dayFilter}
        dayFilterOptions={expenseDayFilterOptions({
          allDaysLabel: t.expenses.filters.allDays,
          itineraryItems: trip.itineraryItems,
          unlinkedLabel: t.expenses.filters.unlinkedDay,
        })}
        displayCurrency={displayCurrency}
        displayExchangeRate={displayExchangeRate}
        expenseCount={filteredExpenses.length}
        members={members}
        payerFilter={payerFilter}
        query={query}
        selectedTripPlanId={selectedTripPlanId}
        settlementCurrency={settlementCurrency}
        t={t}
        tripPlanOptions={workspaceTrip.tripPlans ?? workspaceTrip.planVariants}
        onAddExpense={onAddExpense}
        onAddPersonalExpense={onAddPersonalExpense}
        onCategoryFilterChange={onCategoryFilterChange}
        onClearFilters={onClearFilters}
        onCopyStatement={onCopyStatement}
        onDayFilterChange={onDayFilterChange}
        onDisplayCurrencyChange={onDisplayCurrencyChange}
        onDisplayExchangeRateChange={onDisplayExchangeRateChange}
        onDownloadCsv={onDownloadCsv}
        onPayerFilterChange={onPayerFilterChange}
        onQueryChange={onQueryChange}
        onTripPlanChange={onTripPlanChange}
      />

      {isMobileLedger ? (
        <ExpenseMobileLedgerList
          canEditExpenses={canEditExpenses}
          dayGroups={dayGroups}
          displayCurrency={displayCurrency}
          displayExchangeRate={displayExchangeRateNumber}
          members={members}
          onDeleteExpense={onDeleteExpense}
          onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
          onEditExpense={onEditExpense}
          onRecordRefund={onRecordRefund}
          pendingRefundExpenseIds={pendingRefundExpenseIds}
          settlementCurrency={settlementCurrency}
          tableCopy={{
            actions: t.expenses.actions,
            details: t.expenses.table.details,
            empty: t.expenses.empty,
            uncategorizedStop: t.expenses.uncategorizedStop,
          }}
          trip={trip}
        />
      ) : (
        <div className={expenseStyles.tableWrapClassName}>
          <table className={expenseStyles.tableClassName} aria-label={t.expenses.ledgerLabel}>
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[120px]" />
              <col className="w-[190px]" />
              <col className="w-[120px]" />
              <col className="w-[150px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className={expenseStyles.tableHeaderClassName}>
              <tr>
                <th>{t.expenses.table.expense}</th>
                <th>{t.expenses.table.amount}</th>
                <th>{t.expenses.table.paidBy}</th>
                <th>{t.expenses.table.split}</th>
                <th>{t.expenses.table.linkedStop}</th>
                <th>{t.expenses.table.actions}</th>
              </tr>
            </thead>
            <ExpenseLedgerRows
              canEditExpenses={canEditExpenses}
              dayGroups={dayGroups}
              displayCurrency={displayCurrency}
              displayExchangeRate={displayExchangeRateNumber}
              members={members}
              onDeleteExpense={onDeleteExpense}
              onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
              onEditExpense={onEditExpense}
              onRecordRefund={onRecordRefund}
              pendingRefundExpenseIds={pendingRefundExpenseIds}
              settlementCurrency={settlementCurrency}
              tableCopy={{
                actions: t.expenses.actions,
                details: t.expenses.table.details,
                empty: t.expenses.empty,
                uncategorizedStop: t.expenses.uncategorizedStop,
              }}
              trip={trip}
            />
          </table>
        </div>
      )}
    </section>
  );
}

function useIsMobileLedger() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
