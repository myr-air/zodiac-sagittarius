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
} from "../model/expense-page-types";
import { ExpenseLedgerControls } from "./ExpenseLedgerControls";
import { ExpenseLedgerRows } from "./ExpenseLedgerRows";
import { ExpenseMobileLedgerList } from "./ExpenseMobileLedgerList";
import { ExpenseTransactionDetail } from "./ExpenseTransactionDetail";

interface ExpenseLedgerSectionProps {
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
    filteredExpenses.find((expense) => expense.id === selectedExpenseId) ??
    (!isMobileLedger ? filteredExpenses[0] : null) ??
    null;
  const selectedLedgerExpenseId = selectedExpense?.id ?? null;
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
        {isMobileLedger ? (
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
        ) : (
          <div className={expenseStyles.tableWrapClassName}>
            <table className={expenseStyles.tableClassName} aria-label={t.expenses.ledgerLabel}>
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[128px]" />
                <col className="w-[156px]" />
                <col className="w-[104px]" />
                <col className="w-[132px]" />
                <col className="w-[84px]" />
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
                onEditExpense={onEditExpense}
                onSelectExpense={(expense) => setSelectedExpenseId(expense.id)}
                selectedExpenseId={selectedLedgerExpenseId}
                settlementCurrency={settlementCurrency}
                tableCopy={tableCopy}
                trip={trip}
              />
            </table>
          </div>
        )}

        {selectedExpense || !isMobileLedger ? (
          <ExpenseTransactionDetail
            canEditExpenses={canEditExpenses}
            displayCurrency={displayCurrency}
            displayExchangeRate={displayExchangeRateNumber}
            expense={selectedExpense}
            isMobile={isMobileLedger}
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
