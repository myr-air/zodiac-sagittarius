import { Button, Select } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Expense, Trip } from "@/src/trip/types";
import {
  expenseFormClassName,
  expenseGridClassName,
  detailButtonClassName,
  detailHeadingClassName,
  detailSectionClassName,
  moduleListClassName,
} from "./context-rail.styles";
import { ContextRailExpenseItem } from "./ContextRailExpenseItem";
import {
  contextRailExpenseCategoryOptions,
  useContextRailExpenseForm,
} from "./use-context-rail-expense-form";

interface ContextRailExpensesSectionProps {
  selectedItemId?: string;
  expenses: Expense[];
  members: Trip["members"];
  perPerson: string;
  groupSpend: string;
  canEditExpenses: boolean;
  onCreateExpense: (input: {
    itemId: string | null;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
  onUpdateExpense: (input: {
    expenseId: string;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
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
    <section
      className={`${detailSectionClassName} expense-module`}
      aria-label={t.contextRail.expenses.label}
    >
      <h3 className={detailHeadingClassName}>{t.contextRail.expenses.title}</h3>
      <div className={expenseGridClassName}>
        <span>{t.contextRail.expenses.perPerson}</span>
        <strong>HK${perPerson}</strong>
        <span>
          {t.contextRail.expenses.totalFor({
            count: Math.max(0, members.length - 1),
          })}
        </span>
        <strong>HK${groupSpend}</strong>
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
    </section>
  );
}
