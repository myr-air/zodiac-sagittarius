import { formatMoney, refundAmount, sumShares } from "@/src/trip/expenses";
import { findMemberById, memberInitial } from "@/src/trip/members";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import { categoryTone } from "../model/expense-page-options";
import type {
  DuplicateExpenseAsEstimateHandler,
  ExpenseCategoryFilter,
  ExpenseCopyState,
} from "../model/expense-page-types";
import { ExpenseLedgerControls } from "./ExpenseLedgerControls";

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
          <tbody className={expenseStyles.tableBodyClassName}>
            {filteredExpenses.map((expense) => {
              const payer = findMemberById(members, expense.paidBy);
              const linkedItem = expense.itineraryItemId ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId) : null;
              const tone = categoryTone(expense.category);
              return (
                <tr key={expense.id}>
                  <td className={expenseStyles.tableTitleClassName}>
                    <strong>{expense.title}</strong>
                    <span className={expenseStyles.categoryBadgeClassName} style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.text }}>
                      <span className={expenseStyles.categoryDotClassName} style={{ backgroundColor: tone.dot }} aria-hidden="true" />
                      {expense.category}
                    </span>
                  </td>
                  <td><span className={expenseStyles.ledgerAmountClassName}>{formatMoney(expense.amount, expense.currency ?? settlementCurrency)}</span></td>
                  <td>
                    {payer ? (
                      <span className={expenseStyles.memberLineClassName}>
                        <span className={expenseStyles.avatarClassName} style={{ backgroundColor: payer.color }} aria-hidden="true">{memberInitial(payer.displayName)}</span>
                        <span className={expenseStyles.balanceNameClassName}>{payer.displayName}</span>
                      </span>
                    ) : expense.paidBy}
                  </td>
                  <td>{formatMoney(sumShares(expense.splits), expense.currency ?? settlementCurrency)}</td>
                  <td>{linkedItem?.activity ?? t.expenses.uncategorizedStop}</td>
                  <td>
                    <span className={expenseStyles.actionCellClassName}>
                      <IconButton type="button" aria-label={t.expenses.actions.editExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onEditExpense(expense)}>
                        <Icon name="edit" />
                      </IconButton>
                      <IconButton
                        type="button"
                        aria-label={t.expenses.actions.duplicateAsEstimate({ title: expense.title })}
                        disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
                        onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
                      >
                        <Icon name="copy" />
                      </IconButton>
                      <IconButton
                        type="button"
                        aria-label={t.expenses.actions.recordRefund({ title: expense.title })}
                        disabled={!canEditExpenses || expense.category === "settlement" || refundAmount(expense) <= 0}
                        onClick={() => onRecordRefund(expense)}
                      >
                        <Icon name="wallet" />
                      </IconButton>
                      <IconButton type="button" aria-label={t.expenses.actions.cancelExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
                        <Icon name="trash" />
                      </IconButton>
                    </span>
                  </td>
                </tr>
              );
            })}
            {!filteredExpenses.length ? (
              <tr>
                <td colSpan={6}>{t.expenses.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
