import { SelectOptions } from "@/src/shared/components/select-options";
import { buildExpenseSplits } from "@/src/trip/expenses";
import type { Member, Trip } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { type FormEvent, useMemo, useState } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import type {
  CreateExpenseHandler,
  ExpenseInput,
  ExpensePageLabels,
} from "../model/expense-page-types";
import { manualExpenseCategorySelectOptions } from "../model/expense-page-options";

interface ExpenseQuickCaptureProps {
  canCreateExpenses: boolean;
  currentMember: Member;
  selectedTripPlanId: string;
  settlementCurrency: string;
  t: ExpensePageLabels;
  trip: Trip;
  onCreateExpense: CreateExpenseHandler;
}

type QuickSplitMode = "group" | "personal";

export function ExpenseQuickCapture({
  canCreateExpenses,
  currentMember,
  selectedTripPlanId,
  settlementCurrency,
  t,
  trip,
  onCreateExpense,
}: ExpenseQuickCaptureProps) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseInput["category"]>("food");
  const [splitMode, setSplitMode] = useState<QuickSplitMode>("group");
  const [isSaving, setIsSaving] = useState(false);
  const shareMemberIds = useMemo(() => {
    const memberIds = trip.members
      .filter((member) => member.role !== "viewer" && member.accessStatus !== "disabled")
      .map((member) => member.id);
    return memberIds.length ? memberIds : [currentMember.id];
  }, [currentMember.id, trip.members]);
  const normalizedAmount = Number.parseFloat(amount);
  const canSubmit = canCreateExpenses && Number.isFinite(normalizedAmount) && normalizedAmount > 0 && !isSaving;

  async function submitQuickExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    const spentOn = localDateInputValue(new Date());
    const input: ExpenseInput = {
      itemId: null,
      tripPlanId: selectedTripPlanId,
      title: title.trim() || t.expenses.quickCapture.fallbackTitle({ date: spentOn }),
      amount: normalizedAmount,
      currency: settlementCurrency,
      exchangeRateToSettlementCurrency: 1,
      notes: "",
      spentOn,
      paidBy: currentMember.id,
      category,
      splits: splitMode === "personal"
        ? { [currentMember.id]: normalizedAmount }
        : buildExpenseSplits({
            amount: normalizedAmount,
            memberIds: shareMemberIds,
            mode: "equal",
          }),
    };

    try {
      await onCreateExpense(input);
      setAmount("");
      setTitle("");
      setSplitMode("group");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={expenseStyles.quickCaptureFormClassName} onSubmit={submitQuickExpense}>
      <div className={expenseStyles.quickCaptureAmountRowClassName}>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.fields.amount}</span>
          <input
            inputMode="decimal"
            min="0"
            placeholder={t.expenses.quickCapture.amountPlaceholder}
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.fields.category}</span>
          <Select value={category} onChange={(event) => setCategory(event.target.value as ExpenseInput["category"])}>
            <SelectOptions options={manualExpenseCategorySelectOptions(t.expenses.categories)} />
          </Select>
        </label>
      </div>
      <label className={expenseStyles.fieldClassName}>
        <span>{t.expenses.fields.title}</span>
        <input
          placeholder={t.expenses.quickCapture.titlePlaceholder}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className={expenseStyles.quickCaptureSplitClassName} role="group" aria-label={t.expenses.fields.splitMode}>
        <button
          type="button"
          aria-pressed={splitMode === "group"}
          className={splitMode === "group" ? `${expenseStyles.quickCaptureSplitButtonClassName} ${expenseStyles.quickCaptureSplitButtonActiveClassName}` : expenseStyles.quickCaptureSplitButtonClassName}
          onClick={() => setSplitMode("group")}
        >
          {t.expenses.quickCapture.groupSplit}
        </button>
        <button
          type="button"
          aria-pressed={splitMode === "personal"}
          className={splitMode === "personal" ? `${expenseStyles.quickCaptureSplitButtonClassName} ${expenseStyles.quickCaptureSplitButtonActiveClassName}` : expenseStyles.quickCaptureSplitButtonClassName}
          onClick={() => setSplitMode("personal")}
        >
          {t.expenses.quickCapture.justMine}
        </button>
      </div>
      <Button
        type="submit"
        className={expenseStyles.quickCaptureSubmitClassName}
        disabled={!canSubmit}
      >
        <Icon name="plus" /> {t.expenses.quickCapture.save}
      </Button>
    </form>
  );
}

function localDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
