import type { Member } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCategoryFilterValues } from "../expense-page-support";
import type {
  ExpenseCategoryFilter,
  ExpenseCopyState,
  ExpensePageLabels,
} from "../expense-page-types";

interface ExpenseLedgerControlsProps {
  canEditExpenses: boolean;
  categoryFilter: ExpenseCategoryFilter;
  copyState: ExpenseCopyState;
  members: Member[];
  payerFilter: string;
  query: string;
  t: ExpensePageLabels;
  onAddExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onCopyStatement: () => void;
  onDownloadCsv: () => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
}

export function ExpenseLedgerControls({
  canEditExpenses,
  categoryFilter,
  copyState,
  members,
  payerFilter,
  query,
  t,
  onAddExpense,
  onCategoryFilterChange,
  onClearFilters,
  onCopyStatement,
  onDownloadCsv,
  onPayerFilterChange,
  onQueryChange,
}: ExpenseLedgerControlsProps) {
  return (
    <div className={expenseStyles.commandBarClassName}>
      <div className={expenseStyles.filterGridClassName}>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.search}</span>
          <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => onQueryChange(event.target.value)} />
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.category}</span>
          <Select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as ExpenseCategoryFilter)}>
            {expenseCategoryFilterValues.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? t.expenses.filters.allCategories : category}
              </option>
            ))}
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
  );
}
