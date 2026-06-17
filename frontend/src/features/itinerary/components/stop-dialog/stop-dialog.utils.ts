import type { ActivityType, ItineraryItem, ItineraryItemKind } from "@/src/trip/types";

export type StopDetailType = "transportation" | "stay" | "experience" | "task";

export interface StopDetailValues {
  bookingRef: string;
  budgetNote: string;
  costNote: string;
  detail: string;
  destination: string;
  entryWindow: string;
  meal: string;
  meetingPoint: string;
  mode: string;
  mustSee: string;
  mustTry: string;
  origin: string;
  provider: string;
  reservationName: string;
  targetItems: string;
  taxRefundNote: string;
  ticketRef: string;
}

export const stopDialogDetailTypeOptions: StopDetailType[] = [
  "transportation",
  "stay",
  "experience",
  "task",
];

export const stopDialogDetailTypeToActivityType: Record<StopDetailType, ActivityType> = {
  experience: "experience",
  stay: "stay",
  task: "experience",
  transportation: "travel",
};

export const stopDialogFieldIds = {
  activity: "stop-activity",
  activityType: "stop-activity-type",
  bookingRef: "stop-booking-ref",
  budgetNote: "stop-budget-note",
  costNote: "stop-cost-note",
  day: "stop-day",
  detail: "stop-detail",
  destination: "stop-destination",
  path: "stop-path",
  derivedDuration: "stop-derived-duration",
  endOffsetDays: "stop-end-offset-days",
  endTime: "stop-end-time",
  entryWindow: "stop-entry-window",
  meal: "stop-meal",
  meetingPoint: "stop-meeting-point",
  mode: "stop-mode",
  mustSee: "stop-must-see",
  mustTry: "stop-must-try",
  mapLink: "stop-map-link",
  note: "stop-note",
  origin: "stop-origin",
  place: "stop-place",
  provider: "stop-provider",
  reservationName: "stop-reservation-name",
  startTime: "stop-start-time",
  targetItems: "stop-target-items",
  taxRefundNote: "stop-tax-refund-note",
  ticketRef: "stop-ticket-ref",
  transportation: "stop-transportation",
  itemKind: "stop-item-kind",
  timeMode: "stop-time-mode",
  isPlanBlock: "stop-is-plan-block",
  status: "stop-status",
  priority: "stop-priority",
};

export const emptyStopDetailValues: StopDetailValues = {
  bookingRef: "",
  budgetNote: "",
  costNote: "",
  detail: "",
  destination: "",
  entryWindow: "",
  meal: "",
  meetingPoint: "",
  mode: "",
  mustSee: "",
  mustTry: "",
  origin: "",
  provider: "",
  reservationName: "",
  targetItems: "",
  taxRefundNote: "",
  ticketRef: "",
};

export function stopDetailLabels(locale: "en" | "th") {
  if (locale === "th") {
    return {
      types: {
        experience: "กิจกรรม / สถานที่",
        stay: "ที่พัก",
        task: "โน้ต / สิ่งที่ต้องทำ",
        transportation: "การเดินทางแบบเป็นช่วง",
      },
      fields: {
        advanced: "ตัวเลือกเพิ่มเติม",
        bookingRef: "เลขจอง / booking",
        budgetNote: "งบ / ค่าใช้จ่าย",
        checkWindow: "เวลาเช็กอิน / เช็กเอาต์",
        costNote: "ค่าใช้จ่าย",
        destination: "ถึง",
        detail: "รายละเอียด",
        entryWindow: "รอบ / ช่วงเวลา",
        luggageDetail: "กระเป๋า / รายละเอียด",
        meal: "มื้ออาหาร",
        meetingPoint: "จุดนัดพบ",
        mode: "โดย",
        mustSee: "จุดที่ต้องดู",
        mustTry: "เมนูที่ต้องลอง",
        origin: "จาก",
        provider: "ผู้ให้บริการ",
        relatedPlace: "สถานที่เกี่ยวข้อง",
        reservationName: "ชื่อจอง",
        targetItems: "ของที่อยากซื้อ",
        taxRefundNote: "tax refund",
        ticketRef: "ตั๋ว / pass",
      },
    };
  }

  return {
    types: {
      experience: "Activity / place",
      stay: "Stay",
      task: "Note / task",
      transportation: "Journey",
    },
    fields: {
      advanced: "More options",
      bookingRef: "Booking ref",
      budgetNote: "Budget note",
      checkWindow: "Check-in / out",
      costNote: "Cost / spend note",
      destination: "To",
      detail: "Detail",
      entryWindow: "Round / time slot",
      luggageDetail: "Bag / luggage detail",
      meal: "Meal",
      meetingPoint: "Meeting point",
      mode: "By",
      mustSee: "Must see",
      mustTry: "Must try",
      origin: "From",
      provider: "Provider",
      relatedPlace: "Related place",
      reservationName: "Reservation name",
      targetItems: "Target items",
      taxRefundNote: "Tax refund note",
      ticketRef: "Ticket / pass",
    },
  };
}

export function buildStructuredStopDetails(detailType: StopDetailType, detailValues: StopDetailValues): Record<string, unknown> {
  const details = trimmedStopDetailValues(detailValues);
  const nextDetails: Record<string, unknown> = { kind: detailType };

  for (const key of detailKeysForType(detailType)) {
    const value = details[key];
    if (value) {
      nextDetails[key] = value;
    }
  }
  return nextDetails;
}

export function detailKeysForType(detailType: StopDetailType): Array<keyof StopDetailValues> {
  if (detailType === "transportation") {
    return ["origin", "destination", "mode", "ticketRef", "costNote"];
  }
  if (detailType === "stay") {
    return ["entryWindow", "bookingRef", "detail"];
  }
  if (detailType === "task") {
    return ["detail", "meetingPoint"];
  }
  return ["provider", "meetingPoint", "bookingRef"];
}

export function structuredStopDetailValues(details: Record<string, unknown> | undefined): Partial<StopDetailValues> {
  if (!details) return {};
  return Object.fromEntries(
    Object.keys(emptyStopDetailValues)
      .map((key) => [key, readStringDetail(details[key])] as const)
      .filter(([, value]) => value),
  ) as Partial<StopDetailValues>;
}

export function resolveStopActivityType(
  detailType: StopDetailType,
  currentActivityType: ActivityType,
): ActivityType {
  if (detailType === "transportation" || detailType === "stay") {
    return stopDialogDetailTypeToActivityType[detailType];
  }
  if (detailType === "experience") {
    return currentActivityType === "travel" || currentActivityType === "stay"
      ? "experience"
      : currentActivityType;
  }
  return "experience";
}

export function itemKindForStopDetailType(detailType: StopDetailType): ItineraryItemKind {
  if (detailType === "transportation") return "travel";
  if (detailType === "stay") return "lodging";
  if (detailType === "task") return "note";
  return "activity";
}

export function addMinutesToTime(stopStartTime: string, durationMinutes: number): string {
  const start = timeToMinutes(stopStartTime);
  if (start === null) return "";
  const total = (start + durationMinutes) % (24 * 60);
  return minutesToTime(total);
}

export function endWindowFromDuration(stopStartTime: string, durationMinutes: number): { endOffsetDays: number; endTime: string } | null {
  const start = timeToMinutes(stopStartTime);
  if (start === null) return null;
  const total = start + Math.max(1, durationMinutes);
  return {
    endTime: minutesToTime(total % (24 * 60)),
    endOffsetDays: Math.floor(total / (24 * 60)),
  };
}

export function endOffsetDaysBetweenTimes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return 0;
  return end <= start ? 1 : 0;
}

export function durationBetweenTimes(
  startTime: string,
  endTime: string,
  endOffsetDays = endOffsetDaysBetweenTimes(startTime, endTime),
): number | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return null;
  const duration = end + endOffsetDays * 24 * 60 - start;
  return Math.max(1, duration);
}

export function parseRouteActivity(value: string): { destination: string; durationMinutes?: number; origin: string; startTime?: string } | null {
  const match = /^\s*(.+?)\s*(?:->|→)\s*(.+?)(?:\s*\((.*?)\))?\s*$/.exec(value);
  if (!match) return null;
  const origin = match[1]?.trim();
  const destination = match[2]?.trim();
  if (!origin || !destination) return null;
  const timeRange = parseTimeRange(match[3] ?? "");

  return {
    destination,
    durationMinutes: timeRange?.durationMinutes,
    origin,
    startTime: timeRange?.startTime,
  };
}

export function parseTimeRange(value: string): { durationMinutes: number; startTime: string } | null {
  const match = /(\d{1,2})[.:](\d{2})\s*(am|pm)?\s*[-–]\s*(\d{1,2})[.:](\d{2})\s*(am|pm)?/i.exec(value);
  if (!match) return null;
  const startTime = normalizeClockTime(match[1], match[2], match[3] || match[6]);
  const endTime = normalizeClockTime(match[4], match[5], match[6] || match[3]);
  if (!startTime || !endTime) return null;
  const durationMinutes = durationBetweenTimes(startTime, endTime);
  if (durationMinutes === null) return null;
  return { durationMinutes, startTime };
}

export function detailTypeFromItem(item: ItineraryItem | undefined): StopDetailType {
  const rawKind = item?.details?.kind;
  if (
    rawKind === "transportation" ||
    rawKind === "stay" ||
    rawKind === "experience" ||
    rawKind === "task"
  ) {
    return rawKind;
  }
  return detailTypeFromActivityType(item?.activityType ?? "experience");
}

export const stopDetailTypeFromItem = detailTypeFromItem;

export function detailTypeFromActivityType(activityType: ActivityType): StopDetailType {
  if (activityType === "travel") return "transportation";
  if (activityType === "stay") return "stay";
  return "experience";
}

export function readStringDetail(values: unknown): string {
  return typeof values === "string" ? values : "";
}

function trimmedStopDetailValues(values: StopDetailValues): StopDetailValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as StopDetailValues;
}

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function minutesToTime(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeClockTime(hourText: string, minuteText: string, meridiem?: string): string | null {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return null;
  if (meridiem) {
    const normalizedMeridiem = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) return null;
    if (normalizedMeridiem === "pm" && hour < 12) hour += 12;
    if (normalizedMeridiem === "am" && hour === 12) hour = 0;
  }
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
