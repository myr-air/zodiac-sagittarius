import { FormEvent, ChangeEvent, useState } from "react";
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(members[0]?.id ?? "");
  const [expenseCategory, setExpenseCategory] = useState<Expense["category"]>("food");

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = expenseTitle.trim();
    const amount = Number(expenseAmount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    if (editingExpenseId) {
      onUpdateExpense({
        expenseId: editingExpenseId,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    } else {
      onCreateExpense({
        itemId: selectedItemId ?? null,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    }
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
  }

  function startEditingExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(String(expense.amount));
    setExpensePaidBy(expense.paidBy);
    setExpenseCategory(expense.category);
  }

  const categoryOptions: Expense["category"][] = [
    "food",
    "transport",
    "tickets",
    "stay",
    "shopping",
    "settlement",
  ];

  function onAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setExpenseAmount(event.target.value);
  }

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
            {categoryOptions.map((category) => (
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
