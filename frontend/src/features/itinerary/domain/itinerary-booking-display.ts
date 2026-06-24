import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import {
  bookingTypeForBookingTemplate,
  bookingTypeForItineraryItem,
  type ItineraryBookingTemplate,
} from "@/src/trip/booking-docs";
import { type IconName } from "@/src/ui/icons";
import {
  travelSubtypeForItem,
  travelSubtypeIcons,
  travelSubtypeOptions,
} from "./itinerary-travel-subtypes";
export {
  bookingTitleForItem,
  ticketModalCopy,
  ticketNotesForItem,
  type TicketModalCopy,
} from "./itinerary-ticket-display";

export function bookingIconForItem(item: ItineraryItem): IconName {
  if (item.activityType === "travel") {
    const subtype = travelSubtypeForItem(item);
    return subtype ? travelSubtypeIcons[subtype] : "route";
  }
  if (item.activityType === "stay") return "home";
  if (item.activityType === "food") return "utensils";
  if (item.activityType === "shopping") return "wallet";
  if (item.activityType === "attraction" || item.activityType === "experience") return "ticket";
  return "document";
}

export function bookingTemplateForItem(item: ItineraryItem): ItineraryBookingTemplate {
  const subtype = travelSubtypeForItem(item);
  if (subtype === "flight") return "flight";
  if (subtype === "train") return "train";
  if (item.activityType === "stay") return "hotel";
  if (item.activityType === "attraction" || item.activityType === "experience") return "activity_ticket";
  return "recommended";
}

export function bookingTemplateLabel(item: ItineraryItem, locale: Locale): string {
  const subtype = travelSubtypeForItem(item);
  if (subtype) {
    return travelSubtypeOptions(locale).find((option) => option.value === subtype)?.label ?? subtype;
  }
  const labels: Record<Locale, Record<ItineraryBookingTemplate, string>> = {
    en: {
      activity_ticket: "Ticket",
      flight: "Flight",
      hotel: "Hotel",
      recommended: "Booking",
      train: "Train",
    },
    th: {
      activity_ticket: "ตั๋ว",
      flight: "เครื่องบิน",
      hotel: "ที่พัก",
      recommended: "การจอง",
      train: "รถไฟ",
    },
  };
  return labels[locale][bookingTemplateForItem(item)];
}

export function bookingDocTypeForItemTemplate(
  item: ItineraryItem,
  template: ItineraryBookingTemplate,
): BookingDocType {
  if (template !== "recommended") return bookingTypeForBookingTemplate(template);
  return bookingTypeForItineraryItem(item);
}

export function formatBookingSummary(booking: BookingDoc, items: ItineraryItem[]): string {
  const linkedNames = booking.relatedItineraryItemIds
    .map((id) => items.find((item) => item.id === id)?.activity)
    .filter((value): value is string => Boolean(value));
  const provider = booking.providerName ? `${booking.providerName} · ` : "";
  return `${provider}${linkedNames.length ? linkedNames.join(", ") : booking.status}`;
}
