import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryBookingTemplate } from "@/src/trip/booking-docs";
import { activityTypeLabel, formatDuration } from "@/src/features/itinerary/lib";
import { type IconName } from "@/src/ui/icons";
import type { InlineItineraryItemPatch } from "../lib";

type TravelSubtype = "flight" | "train" | "bus" | "taxi" | "ferry" | "walk" | "car" | "shuttle";
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

const travelSubtypes: TravelSubtype[] = ["flight", "train", "bus", "taxi", "ferry", "walk", "car", "shuttle"];

const travelSubtypeIcons: Record<TravelSubtype, IconName> = {
  bus: "bus",
  car: "car",
  ferry: "ship",
  flight: "plane",
  shuttle: "bus",
  taxi: "car",
  train: "train",
  walk: "walk",
};

const activityTypeIcons: Record<ItineraryItem["activityType"], IconName> = {
  attraction: "location",
  default: "document",
  experience: "ticket",
  food: "utensils",
  shopping: "wallet",
  stay: "home",
  travel: "route",
};

function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatTimeRangeLabel(startTime: string, endTime: string, endOffsetDays = 0): string {
  const endOffset = endOffsetDays > 0 ? ` +${endOffsetDays}` : "";
  return `${startTime || "--:--"} - ${endTime}${endOffset}`;
}

function readItineraryDetailString(
  details: ItineraryItem["details"] | null | undefined,
  key: string,
): string {
  const value = details?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTravelSubtype(value: string | null | undefined): TravelSubtype | null {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z]+/g, "_");
  if (!normalized) return null;
  if (normalized === "plane" || normalized === "airline") return "flight";
  if (normalized === "rail" || normalized === "mtr") return "train";
  if (normalized === "boat" || normalized === "ship") return "ferry";
  if (normalized === "walking") return "walk";
  return travelSubtypes.includes(normalized as TravelSubtype)
    ? (normalized as TravelSubtype)
    : null;
}

function withoutTravelSubtypeDetails(details: ItineraryItem["details"] | null | undefined): ItineraryItem["details"] {
  const nextDetails = { ...(details ?? {}) };
  delete nextDetails.subtype;
  if (normalizeTravelSubtype(readItineraryDetailString(details, "mode"))) {
    delete nextDetails.mode;
  }
  return nextDetails;
}

function buildActivityTypePatch(
  item: ItineraryItem,
  activityType: string,
): InlineItineraryItemPatch {
  const nextActivityType = activityType as ItineraryItem["activityType"];
  if (nextActivityType === "travel") {
    return { activityType: nextActivityType };
  }

  const detailsWithoutTravelMode = withoutTravelSubtypeDetails(item.details);
  return {
    activityType: nextActivityType,
    activitySubtype: null,
    details: detailsWithoutTravelMode,
  };
}

function buildActivitySubtypePatch(
  item: ItineraryItem,
  activityType: ItineraryItem["activityType"],
  subtype: string,
): InlineItineraryItemPatch {
  if (activityType !== "travel") return buildActivityTypePatch(item, activityType);
  return {
    activityType,
    activitySubtype: subtype as ItineraryItem["activitySubtype"],
    details: {
      ...(item.details ?? {}),
      subtype,
    },
  };
}

function activityTypeOptions(locale: Locale): Array<{ icon: IconName; value: string; label: string }> {
  const types: ItineraryItem["activityType"][] = [
    "travel",
    "food",
    "shopping",
    "attraction",
    "experience",
    "stay",
    "default",
  ];
  return types.map((type) => ({
    icon: activityTypeIcons[type],
    value: type,
    label: activityTypeLabel(type, locale),
  }));
}

function travelSubtypeForItem(item: ItineraryItem): TravelSubtype | null {
  if (item.activityType !== "travel") return null;
  const storedSubtype = normalizeTravelSubtype(item.activitySubtype ?? undefined);
  if (storedSubtype) return storedSubtype;

  const subtype = readItineraryDetailString(item.details, "subtype");
  const explicitSubtype = normalizeTravelSubtype(subtype);
  if (explicitSubtype) return explicitSubtype;

  const mode = readItineraryDetailString(item.details, "mode");
  const explicitMode = normalizeTravelSubtype(mode);
  if (explicitMode) return explicitMode;

  const haystack = `${item.transportation} ${item.activity}`.toLowerCase();
  if (/\bflight\b|\bplane\b|\bairline\b|เครื่องบิน|สายการบิน|(^|\s)บิน/.test(haystack)) return "flight";
  if (/\btrain\b|\brail\b|\bmtr\b|รถไฟ|ราง|สถานีรถไฟ/.test(haystack)) return "train";
  if (/\bbus\b|รถบัส|บัส/.test(haystack)) return "bus";
  if (/\btaxi\b|แท็กซี่/.test(haystack)) return "taxi";
  if (/\bferry\b|\bboat\b|เรือ|เฟอร์รี่/.test(haystack)) return "ferry";
  if (/\bwalk\b|\bwalking\b|เดิน/.test(haystack)) return "walk";
  if (/\bshuttle\b|รถรับส่ง/.test(haystack)) return "shuttle";
  if (/\bcar\b|\bdrive\b|รถยนต์/.test(haystack)) return "car";
  return null;
}

function travelSubtypeOptions(locale: Locale): Array<{ icon: IconName; value: TravelSubtype; label: string }> {
  const labels: Record<Locale, Record<TravelSubtype, string>> = {
    en: {
      bus: "Bus",
      car: "Car",
      ferry: "Ferry",
      flight: "Flight",
      shuttle: "Shuttle",
      taxi: "Taxi",
      train: "Train",
      walk: "Walk",
    },
    th: {
      bus: "รถบัส",
      car: "รถยนต์",
      ferry: "เรือ",
      flight: "เครื่องบิน",
      shuttle: "รถรับส่ง",
      taxi: "แท็กซี่",
      train: "รถไฟ",
      walk: "เดิน",
    },
  };
  return travelSubtypes.map((type) => ({
    icon: travelSubtypeIcons[type],
    label: labels[locale][type],
    value: type,
  }));
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

function itineraryDateTimeValue(day: string, time: string | null | undefined): string | null {
  const trimmed = time?.trim();
  return trimmed ? `${day}T${trimmed}` : null;
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : "";
}

function fromDateTimeLocalValue(value: string): string | null {
  return value.trim() || null;
}

function formatBookingSummary(booking: BookingDoc, items: ItineraryItem[]): string {
  const linkedNames = booking.relatedItineraryItemIds
    .map((id) => items.find((item) => item.id === id)?.activity)
    .filter((value): value is string => Boolean(value));
  const provider = booking.providerName ? `${booking.providerName} · ` : "";
  return `${provider}${linkedNames.length ? linkedNames.join(", ") : booking.status}`;
}

function endOffsetDaysBetweenTimes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 0;
  return end <= start ? 1 : 0;
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

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];
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
