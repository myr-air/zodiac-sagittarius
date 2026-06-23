import { buildMemberSelectOptions } from "@/src/features/workspace/model/related-checkbox-options";
import { SelectOptions } from "@/src/shared/components/select-options";
import type { Member } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCategoryFilterSelectOptions } from "../model/expense-page-options";
import type {
  ExpenseCategoryFilter,
  ExpenseCopyState,
  ExpensePageLabels,
} from "../model/expense-page-types";
import { ExpenseCopyFeedback } from "./ExpenseCopyFeedback";

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
            <SelectOptions options={expenseCategoryFilterSelectOptions(t.expenses.filters.allCategories)} />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.payer}</span>
          <Select value={payerFilter} onChange={(event) => onPayerFilterChange(event.target.value)}>
            <option value="all">{t.expenses.filters.allPayers}</option>
            <SelectOptions options={buildMemberSelectOptions(members)} />
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
        <ExpenseCopyFeedback copyState={copyState} t={t} />
      </div>
    </div>
  );
}
