import type { Expense, Member, Trip } from "@/src/trip/types";
import * as expenseStyles from "../TripExpensesPage.styles";
import type {
  DuplicateExpenseAsEstimateHandler,
  ExpenseCategoryFilter,
  ExpenseCopyState,
} from "../model/expense-page-types";
import { ExpenseLedgerControls } from "./ExpenseLedgerControls";
import { ExpenseLedgerRows } from "./ExpenseLedgerRows";

interface ExpenseLedgerSectionProps {
  canEditExpenses: boolean;
  categoryFilter: ExpenseCategoryFilter;
  copyState: ExpenseCopyState;
  filteredExpenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onCopyStatement: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onDownloadCsv: () => void;
  onDuplicateExpenseAsEstimate?: DuplicateExpenseAsEstimateHandler;
  onEditExpense: (expense: Expense) => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
  onRecordRefund: (expense: Expense) => void;
  payerFilter: string;
  query: string;
  settlementCurrency: string;
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  trip: Trip;
}

export function ExpenseLedgerSection({
  canEditExpenses,
  categoryFilter,
  copyState,
  filteredExpenses,
  members,
  onAddExpense,
  onCategoryFilterChange,
  onClearFilters,
  onCopyStatement,
  onDeleteExpense,
  onDownloadCsv,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onPayerFilterChange,
  onQueryChange,
  onRecordRefund,
  payerFilter,
  query,
  settlementCurrency,
  t,
  trip,
}: ExpenseLedgerSectionProps) {
  return (
    <section className="grid min-h-0 content-start gap-3" aria-label={t.expenses.ledgerLabel}>
      <ExpenseLedgerControls
        canEditExpenses={canEditExpenses}
        categoryFilter={categoryFilter}
        copyState={copyState}
        members={members}
        payerFilter={payerFilter}
        query={query}
        t={t}
        onAddExpense={onAddExpense}
        onCategoryFilterChange={onCategoryFilterChange}
        onClearFilters={onClearFilters}
        onCopyStatement={onCopyStatement}
        onDownloadCsv={onDownloadCsv}
        onPayerFilterChange={onPayerFilterChange}
        onQueryChange={onQueryChange}
      />

      <div className={expenseStyles.tableWrapClassName}>
        <table className={expenseStyles.tableClassName} aria-label={t.expenses.ledgerLabel}>
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
            expenses={filteredExpenses}
            members={members}
            onDeleteExpense={onDeleteExpense}
            onDuplicateExpenseAsEstimate={onDuplicateExpenseAsEstimate}
            onEditExpense={onEditExpense}
            onRecordRefund={onRecordRefund}
            settlementCurrency={settlementCurrency}
            tableCopy={{
              actions: t.expenses.actions,
              empty: t.expenses.empty,
              uncategorizedStop: t.expenses.uncategorizedStop,
            }}
            trip={trip}
          />
        </table>
      </div>
    </section>
  );
}
