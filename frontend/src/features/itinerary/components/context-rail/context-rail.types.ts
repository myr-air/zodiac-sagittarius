import type { BookingDocType, Expense } from "@/src/trip/types";

export type ContextRailBookingDocQuickFieldsPatch = {
  confirmationCode?: string | null;
  providerName?: string | null;
};

export type ContextRailBookingDocTypeChangeHandler = (
  bookingDocId: string,
  type: BookingDocType,
) => void | Promise<void>;

export type ContextRailBookingDocQuickFieldsChangeHandler = (
  bookingDocId: string,
  patch: ContextRailBookingDocQuickFieldsPatch,
) => void | Promise<void>;

export type ContextRailCreateNoteInput = {
  itemId: string;
  body: string;
};

export type ContextRailUpdateNoteInput = {
  noteId: string;
  body: string;
};

export type ContextRailCreateExpenseInput = {
  itemId: string | null;
  title: string;
  amount: number;
  paidBy: string;
  category: Expense["category"];
};

export type ContextRailUpdateExpenseInput = {
  expenseId: string;
  title: string;
  amount: number;
  paidBy: string;
  category: Expense["category"];
};
