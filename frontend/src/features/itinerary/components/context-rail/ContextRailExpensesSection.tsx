import { Button, Select } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Expense, Trip } from "@/src/trip/types";
import {
  expenseFormClassName,
  expenseGridClassName,
  detailButtonClassName,
  moduleListClassName,
} from "./context-rail.styles";
import { ContextRailDetailSection } from "./ContextRailDetailSection";
import { ContextRailExpenseItem } from "./ContextRailExpenseItem";
import {
  contextRailExpenseCategoryOptions,
  useContextRailExpenseForm,
} from "./use-context-rail-expense-form";
import type {
  ContextRailCreateExpenseInput,
  ContextRailUpdateExpenseInput,
} from "./context-rail.types";

interface ContextRailExpensesSectionProps {
  selectedItemId?: string;
  expenses: Expense[];
  members: Trip["members"];
  perPerson: string;
  groupSpend: string;
  canEditExpenses: boolean;
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export function ContextRailExpensesSection({
  selectedItemId,
  expenses,
  members,
  perPerson,
  groupSpend,
  canEditExpenses,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ContextRailExpensesSectionProps) {
  const { t } = useI18n();
  const {
    editingExpenseId,
    expenseAmount,
    expenseCategory,
    expensePaidBy,
    expenseTitle,
    onAmountChange,
    setExpenseCategory,
    setExpensePaidBy,
    setExpenseTitle,
    startEditingExpense,
    submitExpense,
  } = useContextRailExpenseForm({
    defaultPaidBy: members[0]?.id ?? "",
    onCreateExpense,
    onUpdateExpense,
    selectedItemId,
  });

  return (
    <ContextRailDetailSection
      className="expense-module"
      ariaLabel={t.contextRail.expenses.label}
      title={t.contextRail.expenses.title}
    >
      <div className={expenseGridClassName}>
        <span>{t.contextRail.expenses.perPerson}</span>
        <strong>{perPerson}</strong>
        <span>
          {t.contextRail.expenses.totalFor({
            count: Math.max(0, members.length - 1),
          })}
        </span>
        <strong>{groupSpend}</strong>
      </div>
      <div className={moduleListClassName}>
        {expenses.map((expense) => (
          <ContextRailExpenseItem
            canEditExpenses={canEditExpenses}
            expense={expense}
            key={expense.id}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={startEditingExpense}
          />
        ))}
      </div>
      <form className={expenseFormClassName} onSubmit={submitExpense}>
        <p className="m-0 text-[11px] font-bold leading-4 text-(--color-text-muted)">
          {t.contextRail.expenses.actualOnlyHint}
        </p>
        <label>
          <span>{t.contextRail.expenses.formTitle}</span>
          <input
            value={expenseTitle}
            disabled={!canEditExpenses}
            onChange={(event) => setExpenseTitle(event.target.value)}
          />
        </label>
        <label>
          <span>{t.contextRail.expenses.formAmount}</span>
          <input
            inputMode="decimal"
            value={expenseAmount}
            disabled={!canEditExpenses}
            onChange={onAmountChange}
          />
        </label>
        <label>
          <span>{t.contextRail.expenses.formPaidBy}</span>
          <Select
            value={expensePaidBy}
            disabled={!canEditExpenses}
            onChange={(event) => setExpensePaidBy(event.target.value)}
          >
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.displayName}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span>{t.contextRail.expenses.formCategory}</span>
          <Select
            value={expenseCategory}
            disabled={!canEditExpenses}
            onChange={(event) =>
              setExpenseCategory(event.target.value as Expense["category"])
            }
          >
            {contextRailExpenseCategoryOptions.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </Select>
        </label>
        <Button
          type="submit"
          variant="secondary"
          className={detailButtonClassName}
          disabled={
            !canEditExpenses || !expenseTitle.trim() || !expenseAmount.trim()
          }
        >
          {editingExpenseId ? t.common.actions.save : t.contextRail.expenses.edit}
        </Button>
      </form>
    </ContextRailDetailSection>
  );
}
