import { buildMemberSelectOptions } from "@/src/features/workspace/model/related-checkbox-options";
import { SelectOptions } from "@/src/shared/components/select-options";
import type { Member } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useEffect, useRef, useState } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCategoryFilterSelectOptions } from "../model/expense-page-options";
import type { ExpenseCategoryFilter, ExpensePageLabels } from "../model/expense-page-types";

interface ExpenseLedgerControlsProps {
  canCreateExpenses: boolean;
  canEditExpenses: boolean;
  categoryFilter: ExpenseCategoryFilter;
  dayFilter: string;
  dayFilterOptions: Array<{ label: string; value: string }>;
  expenseCount: number;
  members: Member[];
  payerFilter: string;
  query: string;
  t: ExpensePageLabels;
  onAddExpense: () => void;
  onAddPersonalExpense: () => void;
  onCategoryFilterChange: (category: ExpenseCategoryFilter) => void;
  onClearFilters: () => void;
  onDayFilterChange: (day: string) => void;
  onPayerFilterChange: (memberId: string) => void;
  onQueryChange: (query: string) => void;
}

export function ExpenseLedgerControls({
  canCreateExpenses,
  canEditExpenses,
  categoryFilter,
  dayFilter,
  dayFilterOptions,
  expenseCount,
  members,
  payerFilter,
  query,
  t,
  onAddExpense,
  onAddPersonalExpense,
  onCategoryFilterChange,
  onClearFilters,
  onDayFilterChange,
  onPayerFilterChange,
  onQueryChange,
}: ExpenseLedgerControlsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const filterPanelId = "expense-ledger-filters";
  const actionsPanelId = "expense-ledger-actions";
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (dayFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (payerFilter !== "all" ? 1 : 0);
  const filterButtonLabel = activeFilterCount
    ? t.expenses.filters.showFiltersWithCount({ count: activeFilterCount })
    : t.expenses.filters.showFilters;

  useEffect(() => {
    if (!showActions) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!event.target || actionsRef.current?.contains(event.target as Node)) return;
      setShowActions(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showActions]);

  return (
    <div className={expenseStyles.commandBarClassName}>
      <div className={expenseStyles.commandBarHeaderClassName}>
        <div className={expenseStyles.commandTitleGroupClassName}>
          <h2 className={expenseStyles.commandTitleClassName}>{t.expenses.ledgerLabel}</h2>
          <div className={expenseStyles.commandMetaClassName}>
            <span className={expenseStyles.liveStatusClassName} role="status" aria-label={t.expenses.live.statusLabel}>
              {t.expenses.live.updated({ count: expenseCount })}
            </span>
          </div>
        </div>
        <label className={`${expenseStyles.fieldClassName} ${expenseStyles.searchFieldClassName}`}>
          <span>{t.expenses.filters.search}</span>
          <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => onQueryChange(event.target.value)} />
        </label>
        <div className={expenseStyles.commandActionsClassName}>
          <Button
            type="button"
            variant="ghost"
            className={expenseStyles.commandIconButtonClassName}
            aria-controls={filterPanelId}
            aria-expanded={showFilters}
            title={showFilters ? t.expenses.filters.hideFilters : t.expenses.filters.showFilters}
            onClick={() => setShowFilters((current) => !current)}
          >
            <Icon name="settings" />
            <span>{filterButtonLabel}</span>
          </Button>
          <Button type="button" className={expenseStyles.commandPrimaryButtonClassName} disabled={!canCreateExpenses && !canEditExpenses} onClick={onAddExpense}>
            <Icon name="plus" /> {t.expenses.actions.addExpense}
          </Button>
          <div
            ref={actionsRef}
            className={expenseStyles.commandMenuClassName}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setShowActions(false);
            }}
          >
            <Button
              type="button"
              variant="ghost"
              className={expenseStyles.commandIconButtonClassName}
              aria-controls={actionsPanelId}
              aria-expanded={showActions}
              aria-label={t.expenses.table.actions}
              title={t.expenses.table.actions}
              onClick={() => setShowActions((current) => !current)}
            >
              <Icon name="dots" />
            </Button>
            <div className={expenseStyles.commandMenuPanelClassName} id={actionsPanelId} hidden={!showActions}>
              <Button type="button" variant="ghost" disabled={!canEditExpenses} onClick={onAddPersonalExpense}>
                <Icon name="wallet" /> {t.expenses.actions.addPersonalExpense}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {activeFilterCount ? (
        <div className={expenseStyles.commandMetaClassName}>
          <span className={expenseStyles.filterActiveSummaryClassName}>
            {t.expenses.filters.activeFilters({ count: activeFilterCount })}
          </span>
        </div>
      ) : null}
      <div className={expenseStyles.filterGridClassName} id={filterPanelId} hidden={!showFilters}>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.day}</span>
          <Select value={dayFilter} onChange={(event) => onDayFilterChange(event.target.value)}>
            <SelectOptions options={dayFilterOptions} />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.category}</span>
          <Select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as ExpenseCategoryFilter)}>
            <SelectOptions options={expenseCategoryFilterSelectOptions(t.expenses.filters.allCategories, t.expenses.categories)} />
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
        <Button type="button" variant="ghost" onClick={onClearFilters}>{t.expenses.actions.clearFilters}</Button>
      </div>
    </div>
  );
}
