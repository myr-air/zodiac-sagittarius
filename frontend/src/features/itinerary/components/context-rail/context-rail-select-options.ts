import { formatBookingDocTypeLabel } from "@/src/features/itinerary/domain/itinerary-booking-display";
import { bookingDocTypeOptions } from "@/src/features/itinerary/domain/itinerary-context-rail-display";
import type { BookingDocType, Expense, Member } from "@/src/trip/types";
import { contextRailExpenseCategoryOptions } from "./context-rail-expense-form-state";

export interface ContextRailSelectOption<Value extends string = string> {
  value: Value;
  label: string;
}

export function contextRailMemberSelectOptions(
  members: readonly Pick<Member, "id" | "displayName">[],
): ContextRailSelectOption[] {
  return members.map((member) => ({
    value: member.id,
    label: member.displayName,
  }));
}

export function contextRailExpenseCategorySelectOptions(): ContextRailSelectOption<
  Expense["category"]
>[] {
  return contextRailExpenseCategoryOptions.map((category) => ({
    value: category,
    label: category,
  }));
}

export function contextRailBookingDocTypeSelectOptions(): ContextRailSelectOption<
  BookingDocType
>[] {
  return bookingDocTypeOptions.map((type) => ({
    value: type,
    label: formatBookingDocTypeLabel(type),
  }));
}
