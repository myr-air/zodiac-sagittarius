import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";
import type { ExpenseDialogCalculatedState } from "./expense-dialog-support";
import type { ExpenseInput } from "./expense-page-types";

interface ExpenseDialogSubmitInputOptions {
  calculatedState: ExpenseDialogCalculatedState;
  category: Expense["category"];
  comments: ExpenseInput["comments"];
  effectiveTripPlanId: string;
  expense: Expense | null;
  itemId: string;
  notes: string;
  paidBy: string;
  receiptUrl: string;
  splitMode: ExpenseSplitMode;
  title: string;
}

export function buildExpenseDialogSubmitInput({
  calculatedState,
  category,
  comments,
  effectiveTripPlanId,
  expense,
  itemId,
  notes,
  paidBy,
  receiptUrl,
  splitMode,
  title,
}: ExpenseDialogSubmitInputOptions): ExpenseInput {
  const input: ExpenseInput = {
    itemId: itemId || null,
    tripPlanId: effectiveTripPlanId || null,
    title: title.trim(),
    amount: calculatedState.amountNumber,
    currency: calculatedState.normalizedCurrency,
    exchangeRateToSettlementCurrency: calculatedState.needsExchangeRate
      ? calculatedState.exchangeRateNumber
      : 1,
    paidBy,
    category,
    splits: calculatedState.splits,
  };
  if (notes.trim()) input.notes = notes.trim();
  if (receiptUrl.trim()) input.receiptUrl = receiptUrl.trim();
  if (splitMode === "itemized") {
    input.lineItems = calculatedState.validLineItems;
  }
  if (comments?.length) input.comments = comments;
  if (!expense && calculatedState.repeatCountNumber > 1) {
    input.repeatCount = calculatedState.repeatCountNumber;
  }
  return input;
}
