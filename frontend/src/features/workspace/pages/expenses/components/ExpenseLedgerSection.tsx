import type { Expense, Member, Trip } from "@/src/trip/types";
import { useState, useSyncExternalStore } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseDayFilterOptions,
  expenseLedgerDayGroups,
} from "../model/expense-page-filters";
import type {
  DuplicateExpenseAsEstimateHandler,
  ExpenseCategoryFilter,
} from "../model/expense-page-types";
import { ExpenseLedgerControls } from "./ExpenseLedgerControls";
import { ExpenseLedgerRows } from "./ExpenseLedgerRows";
import { ExpenseMobileLedgerList } from "./ExpenseMobileLedgerList";
import { ExpenseTransactionDetail } from "./ExpenseTransactionDetail";

interface ExpenseLedgerSectionProps {
  canCreateExpenses: boolean;
  canEditExpenses: boolean;
  categoryFilter: ExpenseCategoryFilter;
  dayFilter: string;
  displayCurrency: string;
  displayExchangeRateNumber: number;
  filteredExpenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  onAddPersonalExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onDayFilterChange: (day: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDuplicateExpenseAsEstimate?: DuplicateExpenseAsEstimateHandler;
  onEditExpense: (expense: Expense) => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
  onRecordRefund: (expense: Expense) => void;
  pendingRefundExpenseIds: Set<string>;
  payerFilter: string;
  query: string;
  settlementCurrency: string;
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  trip: Trip;
}

export function ExpenseLedgerSection({
  canCreateExpenses,
  canEditExpenses,
  categoryFilter,
  dayFilter,
  displayCurrency,
  displayExchangeRateNumber,
  filteredExpenses,
  members,
  onAddExpense,
  onAddPersonalExpense,
  onCategoryFilterChange,
  onClearFilters,
  onDayFilterChange,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onPayerFilterChange,
  onQueryChange,
  onRecordRefund,
  pendingRefundExpenseIds,
  payerFilter,
  query,
  settlementCurrency,
  t,
  trip,
}: ExpenseLedgerSectionProps) {
  const isMobileLedger = useIsMobileLedger();
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );
  const selectedExpense =
    filteredExpenses.find((expense) => expense.id === selectedExpenseId) ?? null;
  const selectedLedgerExpenseId = selectedExpense?.id ?? null;
  const toggleSelectedExpense = (expense: Expense) => {
    setSelectedExpenseId((current) => current === expense.id ? null : expense.id);
  };
  const tableCopy = {
    actions: t.expenses.actions,
    categories: t.expenses.categories,
    details: t.expenses.table.details,
    empty: t.expenses.empty,
    uncategorizedStop: t.expenses.uncategorizedStop,
  };

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
        canCreateExpenses={canCreateExpenses}
        canEditExpenses={canEditExpenses}
        categoryFilter={categoryFilter}
        dayFilter={dayFilter}
        dayFilterOptions={expenseDayFilterOptions({
          allDaysLabel: t.expenses.filters.allDays,
          expenses: filteredExpenses,
          itineraryItems: trip.itineraryItems,
          unlinkedLabel: t.expenses.filters.unlinkedDay,
        })}
        expenseCount={filteredExpenses.length}
        members={members}
        payerFilter={payerFilter}
        query={query}
        t={t}
        onAddExpense={onAddExpense}
        onAddPersonalExpense={onAddPersonalExpense}
        onCategoryFilterChange={onCategoryFilterChange}
        onClearFilters={onClearFilters}
        onDayFilterChange={onDayFilterChange}
        onPayerFilterChange={onPayerFilterChange}
        onQueryChange={onQueryChange}
      />

      <div className={expenseStyles.ledgerWorkspaceClassName}>
        {isMobileLedger === true ? (
          <ExpenseMobileLedgerList
            dayGroups={dayGroups}
            displayCurrency={displayCurrency}
            displayExchangeRate={displayExchangeRateNumber}
            members={members}
            onSelectExpense={(expense) => setSelectedExpenseId(expense.id)}
            selectedExpenseId={selectedLedgerExpenseId}
            settlementCurrency={settlementCurrency}
            tableCopy={tableCopy}
            trip={trip}
          />
        ) : isMobileLedger === false ? (
          <div className={expenseStyles.tableWrapClassName}>
            <table className={expenseStyles.tableClassName} aria-label={t.expenses.ledgerLabel}>
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[8%]" />
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
                onSelectExpense={toggleSelectedExpense}
                pendingRefundExpenseIds={pendingRefundExpenseIds}
                selectedExpenseId={selectedLedgerExpenseId}
                settlementCurrency={settlementCurrency}
                tableCopy={tableCopy}
                trip={trip}
              />
            </table>
          </div>
        ) : null}

        {selectedExpense && isMobileLedger === true ? (
          <ExpenseTransactionDetail
            canEditExpenses={canEditExpenses}
            displayCurrency={displayCurrency}
            displayExchangeRate={displayExchangeRateNumber}
            expense={selectedExpense}
            isMobile={isMobileLedger === true}
            members={members}
            onClose={() => setSelectedExpenseId(null)}
            onDeleteExpense={onDeleteExpense}
            onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
            onEditExpense={onEditExpense}
            onRecordRefund={onRecordRefund}
            pendingRefundExpenseIds={pendingRefundExpenseIds}
            settlementCurrency={settlementCurrency}
            tableCopy={tableCopy}
            trip={trip}
          />
        ) : null}
      </div>
    </section>
  );
}

const mobileLedgerQuery = "(max-width: 767px)";

function useIsMobileLedger() {
  return useSyncExternalStore(
    subscribeToMobileLedger,
    getMobileLedgerSnapshot,
    getMobileLedgerServerSnapshot,
  );
}

function subscribeToMobileLedger(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(mobileLedgerQuery);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileLedgerSnapshot(): boolean | null {
  if (typeof window === "undefined") return null;
  if (!window.matchMedia) return false;
  return window.matchMedia(mobileLedgerQuery).matches;
}

function getMobileLedgerServerSnapshot(): boolean | null {
  return null;
}
