import { formatMoney } from "@/src/trip/expenses";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { Button, IconButton, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import { categoryTone, expenseCategories, memberById, memberInitial, refundAmount, sumShares } from "../expense-page-support";

interface ExpenseLedgerSectionProps {
  canEditExpenses: boolean;
  categoryFilter: "all" | Expense["category"];
  copyState: "idle" | "copied" | "error";
  filteredExpenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  onCategoryFilterChange: (category: "all" | Expense["category"]) => void;
  onClearFilters: () => void;
  onCopyStatement: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onDownloadCsv: () => void;
  onDuplicateExpenseAsEstimate?: (expense: Expense) => void | Promise<void>;
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
      <div className={expenseStyles.commandBarClassName}>
        <div className={expenseStyles.filterGridClassName}>
          <label className={expenseStyles.fieldClassName}>
            <span>{t.expenses.filters.search}</span>
            <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => onQueryChange(event.target.value)} />
          </label>
          <label className={expenseStyles.fieldClassName}>
            <span>{t.expenses.filters.category}</span>
            <Select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as "all" | Expense["category"])}>
              <option value="all">{t.expenses.filters.allCategories}</option>
              {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </label>
          <label className={expenseStyles.fieldClassName}>
            <span>{t.expenses.filters.payer}</span>
            <Select value={payerFilter} onChange={(event) => onPayerFilterChange(event.target.value)}>
              <option value="all">{t.expenses.filters.allPayers}</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
            </Select>
          </label>
          <Button type="button" variant="ghost" onClick={onClearFilters}>{t.expenses.actions.clearFilters}</Button>
        </div>
        <div className={expenseStyles.commandActionsClassName}>
          <Button type="button" variant="ghost" onClick={onCopyStatement}>
            <Icon name="copy" /> {t.expenses.actions.copyStatement}
          </Button>
          <Button type="button" variant="ghost" onClick={onDownloadCsv}>
            <Icon name="export" /> {t.expenses.actions.downloadCsv}
          </Button>
          <Button type="button" disabled={!canEditExpenses} onClick={onAddExpense}>
            <Icon name="plus" /> {t.expenses.actions.addExpense}
          </Button>
          <span className={expenseStyles.copyFeedbackClassName} data-state={copyState} role="status" aria-label={t.expenses.copy.statusLabel}>
            {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : t.expenses.copy.ready}
          </span>
        </div>
      </div>

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
              const payer = memberById(members, expense.paidBy);
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
