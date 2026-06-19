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
