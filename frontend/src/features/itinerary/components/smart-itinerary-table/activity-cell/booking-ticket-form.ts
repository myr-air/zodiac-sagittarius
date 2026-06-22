import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import {
  bookingTitleForItem,
  itineraryDateTimeValue,
  ticketNotesForItem,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import { uniqueIds } from "@/src/shared/collection";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import type { Locale } from "@/src/i18n/types";

export const ticketFormModeValues = ["existing", "new"] as const;
export type TicketFormMode = (typeof ticketFormModeValues)[number];

export interface TicketFormValues {
  title: string;
  providerName: string;
  confirmationCode: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  relatedItineraryItemIds: string[];
}

export function findTicketCandidates(
  bookingDocs: BookingDoc[],
  item: ItineraryItem,
  type: BookingDocType,
): BookingDoc[] {
  return bookingDocs.filter(
    (booking) =>
      booking.relatedItineraryItemIds.includes(item.id) ||
      booking.type === type ||
      (type === "public_transport" &&
        ["flight", "train", "public_transport"].includes(booking.type)),
  );
}

export function findLinkedTicket(
  bookingDocs: BookingDoc[],
  itemId: string,
): BookingDoc | null {
  return (
    bookingDocs.find((booking) =>
      booking.relatedItineraryItemIds.includes(itemId),
    ) ?? null
  );
}

export function buildTicketFormValues({
  booking,
  item,
  locale,
  type,
}: {
  booking: BookingDoc | null;
  item: ItineraryItem;
  locale: Locale;
  type: BookingDocType;
}): TicketFormValues {
  const defaultTitle = bookingTitleForItem(item, type);
  return {
    title: booking?.title ?? defaultTitle,
    providerName:
      booking?.providerName ??
      readItineraryDetailString(item.details, "provider") ??
      "",
    confirmationCode:
      booking?.confirmationCode ??
      readItineraryDetailString(item.details, "bookingRef") ??
      readItineraryDetailString(item.details, "ticketRef") ??
      "",
    startsAt: toDateTimeLocalValue(
      booking?.startsAt ?? itineraryDateTimeValue(item.day, item.startTime),
    ),
    endsAt: toDateTimeLocalValue(
      booking?.endsAt ?? itineraryDateTimeValue(item.day, item.endTime ?? ""),
    ),
    notes: booking?.notes ?? ticketNotesForItem(item, locale),
    relatedItineraryItemIds: uniqueIds([
      ...(booking?.relatedItineraryItemIds ?? []),
      item.id,
    ]),
  };
}

export function buildTicketSubmitInput({
  item,
  mode,
  selectedBooking,
  selectedBookingId,
  template,
  type,
  values,
}: {
  item: ItineraryItem;
  mode: TicketFormMode;
  selectedBooking: BookingDoc | null;
  selectedBookingId: string;
  template: ItineraryBookingTemplate;
  type: BookingDocType;
  values: TicketFormValues;
}): ItineraryBookingTicketInput {
  return {
    bookingDocId: mode === "existing" ? selectedBookingId : null,
    itemId: item.id,
    template,
    type: selectedBooking?.type ?? type,
    title: values.title.trim(),
    status: selectedBooking?.status ?? "draft",
    visibility: selectedBooking?.visibility ?? "shared",
    providerName: values.providerName.trim() || null,
    confirmationCode: values.confirmationCode.trim() || null,
    startsAt: fromDateTimeLocalValue(values.startsAt),
    endsAt: fromDateTimeLocalValue(values.endsAt),
    travelerIds: selectedBooking?.travelerIds ?? [],
    relatedItineraryItemIds: uniqueIds([
      ...values.relatedItineraryItemIds,
      item.id,
    ]),
    notes: values.notes.trim() || null,
  };
}
