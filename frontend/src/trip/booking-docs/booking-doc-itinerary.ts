import { itineraryDateTime, shiftIsoDate } from "../itinerary-core";
import type {
  BookingDocType,
  ItineraryItem,
} from "../types";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInputLike,
} from "./booking-doc-inputs";
export { bookingDraftTitleForItineraryItem } from "./booking-doc-display";

export function bookingTypeForItineraryItem(item: ItineraryItem): BookingDocType {
  const mode =
    typeof item.details?.mode === "string" ? item.details.mode.toLowerCase() : "";
  const transportation = item.transportation.toLowerCase();
  const activity = item.activity.toLowerCase();
  const haystack = `${mode} ${transportation} ${activity}`;
  if (/\bflight\b|\bplane\b|\bairline\b|เครื่องบิน|สายการบิน|(^|\s)บิน/.test(haystack)) {
    return "flight";
  }
  if (/\btrain\b|\brail\b|\bmtr\b|รถไฟ|ราง|สถานีรถไฟ/.test(haystack)) {
    return "train";
  }
  if (/\bbus\b|\bferry\b|\bshuttle\b|\btram\b|\btaxi\b|รถบัส|บัส|เรือ|เฟอร์รี่|รถรับส่ง|แท็กซี่|รถราง/.test(haystack)) {
    return "public_transport";
  }
  if (
    item.activityType === "stay" ||
    item.itemKind === "lodging" ||
    /โรงแรม|ที่พัก|พักค้างคืน|เช็คอิน|check[-\s]?in/.test(haystack)
  ) {
    return "hotel";
  }
  if (item.activityType === "attraction" || item.itemKind === "activity") {
    return "activity_ticket";
  }
  return "other";
}

export function syncItineraryDetailsWithBookingTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInputLike,
): ItineraryItem["details"] {
  const nextDetails = { ...(item.details ?? {}) };
  const mode = itineraryTravelModeForTicket(item, input);
  if (mode) nextDetails.mode = mode;

  if (input.providerName?.trim()) nextDetails.provider = input.providerName.trim();
  else delete nextDetails.provider;

  if (input.confirmationCode?.trim()) {
    nextDetails.bookingRef = input.confirmationCode.trim();
    nextDetails.ticketRef = input.confirmationCode.trim();
  } else {
    delete nextDetails.bookingRef;
    delete nextDetails.ticketRef;
  }

  if (input.startsAt) nextDetails.ticketStartsAt = input.startsAt;
  else delete nextDetails.ticketStartsAt;
  if (input.endsAt) nextDetails.ticketEndsAt = input.endsAt;
  else delete nextDetails.ticketEndsAt;

  return nextDetails;
}

export function clearItineraryBookingTicketDetails(
  item: ItineraryItem,
): ItineraryItem["details"] {
  const nextDetails = { ...(item.details ?? {}) };
  delete nextDetails.provider;
  delete nextDetails.bookingRef;
  delete nextDetails.ticketRef;
  delete nextDetails.ticketStartsAt;
  delete nextDetails.ticketEndsAt;
  return nextDetails;
}

export function uniqueStringIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function bookingTypeForBookingTemplate(
  template: Exclude<ItineraryBookingTemplate, "recommended">,
): BookingDocType {
  if (template === "activity_ticket") return "activity_ticket";
  return template;
}

export function bookingDraftDetailsForItineraryItem(item: ItineraryItem): {
  confirmationCode: string | null;
  notes: string;
  providerName: string | null;
} {
  const providerName =
    readItineraryDetailString(item.details, "provider") ||
    readItineraryDetailString(item.details, "mode") ||
    null;
  const confirmationCode =
    readItineraryDetailString(item.details, "bookingRef") ||
    readItineraryDetailString(item.details, "ticketRef") ||
    null;
  const notes = [
    item.place ? `Draft from itinerary: ${item.place}` : "Draft from itinerary",
    readItineraryDetailString(item.details, "entryWindow"),
    readItineraryDetailString(item.details, "costNote"),
    readItineraryDetailString(item.details, "detail"),
  ].filter((value): value is string => Boolean(value));

  return {
    confirmationCode,
    notes: notes.join("\n"),
    providerName,
  };
}

export function bookingDraftTimeWindowForItineraryItem(item: ItineraryItem): {
  endsAt: string | null;
  startsAt: string | null;
} {
  const startTime = item.startTime?.trim();
  const endTime = item.endTime?.trim();
  return {
    startsAt: startTime ? itineraryDateTime(item.day, startTime) : null,
    endsAt: endTime
      ? itineraryDateTime(
          shiftIsoDate(item.day, item.endOffsetDays ?? 0),
          endTime,
        )
      : null,
  };
}

function itineraryTravelModeForTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInputLike,
): string | null {
  if (item.activityType !== "travel") return null;
  const existingMode = readItineraryDetailString(item.details, "mode");
  if (input.itemId !== item.id && existingMode) return existingMode;
  if (input.template === "flight" || input.type === "flight") return "flight";
  if (input.template === "train" || input.type === "train") return "train";
  if (existingMode) return existingMode;
  if (input.type === "public_transport") return "transport";
  return null;
}

function readItineraryDetailString(
  details: ItineraryItem["details"] | null | undefined,
  key: string,
): string {
  const value = details?.[key];
  return typeof value === "string" ? value.trim() : "";
}
