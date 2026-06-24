import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";
import type { ExpenseDialogCalculatedState } from "./expense-dialog-calculation";
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
  spentOn: string;
  storedValueCardName: string;
  storedValueTransactionType: NonNullable<Expense["storedValueTransactionType"]> | "";
  title: string;
}

function storedValueCardIdFromName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  spentOn,
  storedValueCardName,
  storedValueTransactionType,
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
  if (spentOn) input.spentOn = spentOn;
  if (storedValueCardName.trim() && storedValueTransactionType) {
    const nextCardName = storedValueCardName.trim();
    input.storedValueCardName = nextCardName;
    input.storedValueCardId =
      expense?.storedValueCardName === nextCardName && expense.storedValueCardId
        ? expense.storedValueCardId
        : storedValueCardIdFromName(nextCardName);
    input.storedValueTransactionType = storedValueTransactionType;
  } else if (expense) {
    input.storedValueCardName = null;
    input.storedValueCardId = null;
    input.storedValueTransactionType = null;
  }
  if (splitMode === "itemized") {
    input.lineItems = calculatedState.validLineItems;
  }
  if (comments?.length) input.comments = comments;
  if (!expense && calculatedState.repeatCountNumber > 1) {
    input.repeatCount = calculatedState.repeatCountNumber;
  }
  return input;
}
