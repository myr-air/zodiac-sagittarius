import type { ChangeEvent, FormEvent } from "react";
import { Button, Select } from "@/src/ui";
import type { Expense, Member } from "@/src/trip/types";
import {
  detailButtonClassName,
  expenseFormClassName,
} from "./context-rail.styles";
import { contextRailExpenseCategoryOptions } from "./context-rail-expense-form-state";

interface ContextRailExpenseFormProps {
  canEditExpenses: boolean;
  editingExpenseId: string | null;
  expenseAmount: string;
  expenseCategory: Expense["category"];
  expensePaidBy: string;
  expenseTitle: string;
  labels: {
    actualOnlyHint: string;
    amount: string;
    category: string;
    create: string;
    paidBy: string;
    save: string;
    title: string;
  };
  members: Member[];
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (category: Expense["category"]) => void;
  onPaidByChange: (paidBy: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
}

export function ContextRailExpenseForm({
  canEditExpenses,
  editingExpenseId,
  expenseAmount,
  expenseCategory,
  expensePaidBy,
  expenseTitle,
  labels,
  members,
  onAmountChange,
  onCategoryChange,
  onPaidByChange,
  onSubmit,
  onTitleChange,
}: ContextRailExpenseFormProps) {
  return (
    <form className={expenseFormClassName} onSubmit={onSubmit}>
      <p className="m-0 text-[11px] font-bold leading-4 text-(--color-text-muted)">
        {labels.actualOnlyHint}
      </p>
      <label>
        <span>{labels.title}</span>
        <input
          value={expenseTitle}
          disabled={!canEditExpenses}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label>
        <span>{labels.amount}</span>
        <input
          inputMode="decimal"
          value={expenseAmount}
          disabled={!canEditExpenses}
          onChange={onAmountChange}
        />
      </label>
      <label>
        <span>{labels.paidBy}</span>
        <Select
          value={expensePaidBy}
          disabled={!canEditExpenses}
          onChange={(event) => onPaidByChange(event.target.value)}
        >
          {members.map((member) => (
            <option value={member.id} key={member.id}>
              {member.displayName}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span>{labels.category}</span>
        <Select
          value={expenseCategory}
          disabled={!canEditExpenses}
          onChange={(event) =>
            onCategoryChange(event.target.value as Expense["category"])
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
        {editingExpenseId ? labels.save : labels.create}
      </Button>
    </form>
  );
}
