import {
  buildSelectOptions,
  type SelectOption,
} from "@/src/shared/select-options";
import {
  bookingDocTypeValues,
  formatBookingDocTypeLabel,
} from "@/src/trip/booking-docs";
import { expenseCategorySelectOptions } from "@/src/trip/expenses";
import { buildMemberSelectOptions } from "@/src/trip/members";
import type { BookingDocType, Expense, Member } from "@/src/trip/types";

export type ContextRailSelectOption<Value extends string = string> = SelectOption<Value>;

export function contextRailMemberSelectOptions(
  members: readonly Pick<Member, "id" | "displayName">[],
): ContextRailSelectOption[] {
  return buildMemberSelectOptions(members);
}

export function contextRailExpenseCategorySelectOptions(): ContextRailSelectOption<
  Expense["category"]
>[] {
  return expenseCategorySelectOptions();
}

export function contextRailBookingDocTypeSelectOptions(): ContextRailSelectOption<
  BookingDocType
>[] {
  return buildSelectOptions(bookingDocTypeValues, formatBookingDocTypeLabel);
}
