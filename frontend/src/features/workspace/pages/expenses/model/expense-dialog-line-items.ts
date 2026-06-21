import { nextLocalExpenseLineItemId } from "@/src/trip/identity";
import type { Expense, ExpenseLineItem, Member } from "@/src/trip/types";

export interface EditableExpenseLineItem {
  id: string;
  title: string;
  amount: string;
  participantIds: string[];
}

export function emptyExpenseLineItem(
  members: Member[],
  lineItems: EditableExpenseLineItem[] = [],
): EditableExpenseLineItem {
  return {
    id: nextLocalExpenseLineItemId(lineItems),
    title: "",
    amount: "",
    participantIds: members.map((member) => member.id),
  };
}

export function initialExpenseLineItems(
  expense: Expense | null,
  members: Member[],
): EditableExpenseLineItem[] {
  if (!expense?.lineItems?.length) {
    return [emptyExpenseLineItem(members)];
  }

  return expense.lineItems.map((lineItem) => ({
    ...lineItem,
    amount: String(lineItem.amount),
    participantIds: lineItem.participantIds.filter((memberId) =>
      members.some((member) => member.id === memberId),
    ),
  }));
}

export function parseExpenseLineItems(
  lineItems: EditableExpenseLineItem[],
): ExpenseLineItem[] {
  return lineItems.map((lineItem, index) => ({
    id: lineItem.id || `line-${index + 1}`,
    title: lineItem.title.trim(),
    amount: Number(lineItem.amount || 0),
    participantIds: lineItem.participantIds,
  }));
}

export function validExpenseLineItems(
  lineItems: ExpenseLineItem[],
): ExpenseLineItem[] {
  return lineItems.filter(
    (lineItem) =>
      lineItem.title &&
      Number.isFinite(lineItem.amount) &&
      lineItem.amount > 0 &&
      lineItem.participantIds.length > 0,
  );
}
