import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryBookingTemplate } from "@/src/trip/booking-docs";
import { formatDuration } from "@/src/features/itinerary/lib";
import { type IconName } from "@/src/ui/icons";
import {
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  endOffsetDaysBetweenTimes,
  parseTimeToMinutes,
  toDateTimeLocalValue,
} from "../lib/itinerary-time";
import {
  readItineraryDetailString,
  toggleId,
  uniqueIds,
} from "../lib/itinerary-item-helpers";
import {
  activityTypeOptions,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  normalizeTravelSubtype,
  travelSubtypeForItem,
  travelSubtypeIcons,
  travelSubtypeOptions,
  type TravelSubtype,
  withoutTravelSubtypeDetails,
} from "./itinerary-activity-types";

type TicketModalCopy = {
  cancel: string;
  close: string;
  confirmation: string;
  endsAt: string;
  existingTickets: string;
  linkedActivities: string;
  newTicket: string;
  noExisting: string;
  notes: string;
  provider: string;
  save: string;
  startsAt: string;
  subtitle: string;
  ticketTitle: string;
  title: (activity: string) => string;
  unlink: string;
  unlinking: string;
  useExisting: string;
};

function formatTimeRangeLabel(startTime: string, endTime: string, endOffsetDays = 0): string {
  const endOffset = endOffsetDays > 0 ? ` +${endOffsetDays}` : "";
  return `${startTime || "--:--"} - ${endTime}${endOffset}`;
}

function bookingIconForItem(item: ItineraryItem): IconName {
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

function bookingTemplateForItem(item: ItineraryItem): ItineraryBookingTemplate {
  const subtype = travelSubtypeForItem(item);
  if (subtype === "flight") return "flight";
  if (subtype === "train") return "train";
  if (item.activityType === "stay") return "hotel";
  if (item.activityType === "attraction" || item.activityType === "experience") return "activity_ticket";
  return "recommended";
}

function bookingTemplateLabel(item: ItineraryItem, locale: Locale): string {
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

function bookingDocTypeForItemTemplate(
  item: ItineraryItem,
  template: ItineraryBookingTemplate,
): BookingDocType {
  if (template === "flight") return "flight";
  if (template === "train") return "train";
  if (template === "hotel") return "hotel";
  if (template === "activity_ticket") return "activity_ticket";

  const subtype = travelSubtypeForItem(item);
  if (subtype === "flight") return "flight";
  if (subtype === "train") return "train";
  if (item.activityType === "travel") return "public_transport";
  if (item.activityType === "stay") return "hotel";
  if (item.activityType === "attraction" || item.activityType === "experience") return "activity_ticket";
  return "other";
}

function bookingTitleForItem(item: ItineraryItem, type: BookingDocType): string {
  const suffixByType: Partial<Record<BookingDocType, string>> = {
    activity_ticket: "ticket",
    flight: "flight ticket",
    hotel: "hotel booking",
    public_transport: "transport ticket",
    train: "train ticket",
    other: "booking",
  };
  return `${item.activity} ${suffixByType[type] ?? "booking"}`;
}

function ticketNotesForItem(item: ItineraryItem, locale: Locale): string {
  const from = readItineraryDetailString(item.details, "from");
  const to = readItineraryDetailString(item.details, "to") || item.place;
  const parts = [
    locale === "th" ? "จาก itinerary" : "From itinerary",
    from ? `${locale === "th" ? "จาก" : "From"}: ${from}` : null,
    to ? `${locale === "th" ? "ถึง" : "To"}: ${to}` : null,
    item.transportation || null,
  ].filter(Boolean);
  return parts.join("\n");
}

function ticketModalCopy(locale: Locale): TicketModalCopy {
  if (locale === "th") {
    return {
      cancel: "ยกเลิก",
      close: "ปิด modal ตั๋ว",
      confirmation: "เลข booking / ticket",
      endsAt: "ถึงเวลา",
      existingTickets: "ตั๋วที่มีอยู่",
      linkedActivities: "ใช้ตั๋วนี้กับ activity",
      newTicket: "ตั๋วใหม่",
      noExisting: "ยังไม่มีตั๋วที่เข้ากับ activity นี้",
      notes: "โน้ต",
      provider: "สายการบิน / ผู้ให้บริการ",
      save: "บันทึกตั๋ว",
      startsAt: "ออกเวลา",
      subtitle: "กรอกข้อมูลตั๋ว หรือเลือกตั๋วเดิมเพื่อไม่สร้างซ้ำ",
      ticketTitle: "ชื่อตั๋ว",
      title: (activity) => `ตั๋วสำหรับ ${activity}`,
      unlink: "ยกเลิก link",
      unlinking: "กำลังยกเลิก...",
      useExisting: "ใช้ตั๋วเดิม",
    };
  }

  return {
    cancel: "Cancel",
    close: "Close ticket modal",
    confirmation: "Booking / ticket number",
    endsAt: "Arrives at",
    existingTickets: "Existing tickets",
    linkedActivities: "Use this ticket for activities",
    newTicket: "New ticket",
    noExisting: "No matching tickets yet",
    notes: "Notes",
    provider: "Airline / provider",
    save: "Save ticket",
    startsAt: "Departs at",
    subtitle: "Enter ticket details or reuse an existing ticket to avoid duplicates.",
    ticketTitle: "Ticket title",
    title: (activity) => `Ticket for ${activity}`,
    unlink: "Unlink",
    unlinking: "Unlinking...",
    useExisting: "Use existing",
  };
}

function formatBookingSummary(booking: BookingDoc, items: ItineraryItem[]): string {
  const linkedNames = booking.relatedItineraryItemIds
    .map((id) => items.find((item) => item.id === id)?.activity)
    .filter((value): value is string => Boolean(value));
  const provider = booking.providerName ? `${booking.providerName} · ` : "";
  return `${provider}${linkedNames.length ? linkedNames.join(", ") : booking.status}`;
}

function formatTimeTooltip(
  item: Pick<ItineraryItem, "startTime" | "endTime" | "endOffsetDays" | "durationMinutes">,
  locale: Locale,
): string {
  const startTime = item.startTime?.trim() || "--:--";
  const endTime = item.endTime?.trim();
  const lines = [
    endTime
      ? formatTimeRangeLabel(startTime, endTime, item.endOffsetDays ?? 0)
      : startTime,
  ];
  if (endTime && item.durationMinutes) {
    lines.push(formatDuration(item.durationMinutes, locale));
  }
  return lines.join("\n");
}

export {
  activityTypeOptions,
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  bookingTitleForItem,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  endOffsetDaysBetweenTimes,
  formatBookingSummary,
  formatTimeRangeLabel,
  formatTimeTooltip,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  normalizeTravelSubtype,
  parseTimeToMinutes,
  readItineraryDetailString,
  toDateTimeLocalValue,
  ticketModalCopy,
  ticketNotesForItem,
  travelSubtypeForItem,
  travelSubtypeOptions,
  uniqueIds,
  withoutTravelSubtypeDetails,
  toggleId,
};

export type { TravelSubtype };
