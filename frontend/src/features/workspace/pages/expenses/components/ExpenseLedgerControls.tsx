import { buildMemberSelectOptions } from "@/src/features/workspace/model/related-checkbox-options";
import { SelectOptions } from "@/src/shared/components/select-options";
import { majorCurrencySelectOptions } from "@/src/trip/currencies";
import { buildTripPlanSelectOptions } from "@/src/trip/trip-plans";
import type { Member, TripPlan } from "@/src/trip/types";
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
  dayFilter: string;
  dayFilterOptions: Array<{ label: string; value: string }>;
  displayCurrency: string;
  displayExchangeRate: string;
  expenseCount: number;
  members: Member[];
  payerFilter: string;
  query: string;
  selectedTripPlanId: string;
  settlementCurrency: string;
  t: ExpensePageLabels;
  tripPlanOptions: TripPlan[];
  onAddExpense: () => void;
  onAddPersonalExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onCopyStatement: () => void;
  onDayFilterChange: (day: string) => void;
  onDisplayCurrencyChange: (currency: string) => void;
  onDisplayExchangeRateChange: (rate: string) => void;
  onDownloadCsv: () => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
  onTripPlanChange?: (tripPlanId: string) => void;
}

export function ExpenseLedgerControls({
  canEditExpenses,
  categoryFilter,
  copyState,
  dayFilter,
  dayFilterOptions,
  displayCurrency,
  displayExchangeRate,
  expenseCount,
  members,
  payerFilter,
  query,
  selectedTripPlanId,
  settlementCurrency,
  t,
  tripPlanOptions,
  onAddExpense,
  onAddPersonalExpense,
  onCategoryFilterChange,
  onClearFilters,
  onCopyStatement,
  onDayFilterChange,
  onDisplayCurrencyChange,
  onDisplayExchangeRateChange,
  onDownloadCsv,
  onPayerFilterChange,
  onQueryChange,
  onTripPlanChange,
}: ExpenseLedgerControlsProps) {
  const needsDisplayExchangeRate = displayCurrency !== settlementCurrency;
  return (
    <div className={expenseStyles.commandBarClassName}>
      <div className={expenseStyles.commandBarHeaderClassName}>
        <div className={expenseStyles.commandTitleGroupClassName}>
          <h2 className={expenseStyles.commandTitleClassName}>{t.expenses.ledgerLabel}</h2>
          <div className={expenseStyles.commandMetaClassName}>
            <span className={expenseStyles.liveStatusClassName} role="status" aria-label={t.expenses.live.statusLabel}>
              {t.expenses.live.updated({ count: expenseCount })}
            </span>
            <ExpenseCopyFeedback copyState={copyState} t={t} />
          </div>
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
          <Button type="button" variant="ghost" disabled={!canEditExpenses} onClick={onAddPersonalExpense}>
            <Icon name="wallet" /> {t.expenses.actions.addPersonalExpense}
          </Button>
        </div>
      </div>
      <div className={expenseStyles.filterGridClassName}>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.search}</span>
          <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => onQueryChange(event.target.value)} />
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.fields.tripPlan}</span>
          <Select value={selectedTripPlanId} onChange={(event) => onTripPlanChange?.(event.target.value)}>
            <SelectOptions options={buildTripPlanSelectOptions(tripPlanOptions)} />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.day}</span>
          <Select value={dayFilter} onChange={(event) => onDayFilterChange(event.target.value)}>
            <SelectOptions options={dayFilterOptions} />
          </Select>
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
            <SelectOptions
              options={buildMemberSelectOptions(members, {
                leadingOption: {
                  value: "all",
                  label: t.expenses.filters.allPayers,
                },
              })}
            />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.displayCurrency}</span>
          <Select value={displayCurrency} onChange={(event) => onDisplayCurrencyChange(event.target.value)}>
            <SelectOptions options={majorCurrencySelectOptions()} />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.displayExchangeRate({ currency: settlementCurrency, displayCurrency })}</span>
          <input
            disabled={!needsDisplayExchangeRate}
            inputMode="decimal"
            value={displayExchangeRate}
            onChange={(event) => onDisplayExchangeRateChange(event.target.value)}
          />
        </label>
        <Button type="button" variant="ghost" onClick={onClearFilters}>{t.expenses.actions.clearFilters}</Button>
      </div>
    </div>
  );
}
