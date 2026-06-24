import { formatBookingDocTypeLabel } from "@/src/features/itinerary/domain/itinerary-booking-display";
import { bookingDocTypeOptions } from "@/src/features/itinerary/domain/itinerary-context-rail-display";
import {
  buildSelectOptions,
  buildSelectOptionsFromItems,
  type SelectOption,
} from "@/src/shared/select-options";
import { expenseCategorySelectOptions } from "@/src/trip/expenses";
import type { BookingDocType, Expense, Member } from "@/src/trip/types";

export type ContextRailSelectOption<Value extends string = string> = SelectOption<Value>;

export function contextRailMemberSelectOptions(
  members: readonly Pick<Member, "id" | "displayName">[],
): ContextRailSelectOption[] {
  return buildSelectOptionsFromItems(
    members,
    (member) => member.id,
    (member) => member.displayName,
  );
}

export function contextRailExpenseCategorySelectOptions(): ContextRailSelectOption<
  Expense["category"]
>[] {
  return expenseCategorySelectOptions();
}

export function contextRailBookingDocTypeSelectOptions(): ContextRailSelectOption<
  BookingDocType
>[] {
  return buildSelectOptions(bookingDocTypeOptions, formatBookingDocTypeLabel);
}
