import {
  type BookingDocInputLike,
  type ItineraryBookingTemplate,
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingTypeForBookingTemplate,
  bookingTypeForItineraryItem,
} from "@/src/trip/booking-docs";
import type { ItineraryItem, Member } from "@/src/trip/types";

interface BookingDraftInputContext {
  currentMemberId: string;
  defaultTimezone?: string | null;
  item: ItineraryItem;
  members: Pick<Member, "id">[];
  template: ItineraryBookingTemplate;
}

export function buildItineraryBookingDraftInput({
  currentMemberId,
  defaultTimezone,
  item,
  members,
  template,
}: BookingDraftInputContext): BookingDocInputLike {
  const draftDetails = bookingDraftDetailsForItineraryItem(item);
  const timeWindow = bookingDraftTimeWindowForItineraryItem(item);
  const bookingType =
    template === "recommended"
      ? bookingTypeForItineraryItem(item)
      : bookingTypeForBookingTemplate(template);

  return {
    type: bookingType,
    title: bookingDraftTitleForItineraryItem(item, bookingType),
    status: "draft",
    visibility: "shared",
    ownerMemberId: currentMemberId,
    providerName: draftDetails.providerName,
    confirmationCode: draftDetails.confirmationCode,
    startsAt: timeWindow.startsAt,
    endsAt: timeWindow.endsAt,
    timezone: defaultTimezone ?? null,
    priceAmount: null,
    currency: null,
    travelerIds: members.map((member) => member.id),
    externalLinks: [],
    relatedItineraryItemIds: [item.id],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: draftDetails.notes,
  };
}
