import type { BookingDoc } from "../types";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "./itinerary-import-export-types";

export function buildSpreadsheetLinkedRecords({
  item,
  noteText,
  rowNumber,
}: {
  item: ItineraryExportItem;
  noteText: string;
  rowNumber: number;
}): Pick<ItineraryExportRecords, "bookingDocs" | "stopNotes" | "tasks"> {
  const bookingHint = hasBookingHint(noteText);
  const price = parseMoneyHint(noteText);
  const records: Pick<ItineraryExportRecords, "bookingDocs" | "stopNotes" | "tasks"> = {
    bookingDocs: [],
    stopNotes: [],
    tasks: [],
  };

  if (item.note) {
    records.stopNotes.push({
      id: `csv-note-row-${rowNumber}`,
      tripId: "",
      tripPlanId: null,
      itemId: item.id,
      authorId: "",
      body: item.note,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  if (bookingHint || price) {
    const bookingId = `csv-booking-row-${rowNumber}`;
    records.bookingDocs.push({
      id: bookingId,
      tripId: "",
      tripPlanId: null,
      type: bookingTypeForImportedItem(item),
      title: `${item.activity} draft`,
      status: "draft",
      visibility: "shared",
      ownerMemberId: null,
      providerName: null,
      confirmationCode: null,
      startsAt: item.startTime ? `${item.day}T${item.startTime}:00` : null,
      endsAt: item.endTime ? `${item.day}T${item.endTime}:00` : null,
      timezone: null,
      priceAmount: price?.amount ?? null,
      currency: price?.currency ?? null,
      travelerIds: [],
      externalLinks: [],
      relatedItineraryItemIds: [item.id],
      relatedTaskIds: bookingHint ? [`csv-task-row-${rowNumber}`] : [],
      relatedExpenseIds: [],
      noteIds: item.note ? [`csv-note-row-${rowNumber}`] : [],
      notes: noteText || null,
      createdBy: "",
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  if (bookingHint) {
    records.tasks.push({
      id: `csv-task-row-${rowNumber}`,
      tripPlanId: null,
      title: `Confirm ${item.activity}`,
      status: "open",
      visibility: "shared",
      kind: "booking",
      createdBy: "",
      assigneeId: null,
      relatedItemId: item.id,
      version: 1,
    });
  }

  return records;
}

export function hasBookingHint(value: string): boolean {
  return /(?:book|booking|reserve|reservation|ticket|ตั๋ว|จอง)/i.test(value);
}

export function parseMoneyHint(value: string): { amount: number; currency: string } | null {
  const currencyFirst = value.match(/\b(HKD|THB|CNY|RMB|USD)\s*(\d+(?:[.,]\d+)?)\b/i);
  const amountFirst = value.match(/\b(\d+(?:[.,]\d+)?)\s*(HKD|THB|CNY|RMB|USD)\b/i);
  const match = currencyFirst ?? amountFirst;
  if (!match) return null;
  const amount = Number.parseFloat((currencyFirst ? match[2] : match[1])?.replace(",", ".") ?? "");
  const rawCurrency = (currencyFirst ? match[1] : match[2])?.toUpperCase() ?? "";
  if (!Number.isFinite(amount) || !rawCurrency) return null;
  return { amount, currency: rawCurrency === "RMB" ? "CNY" : rawCurrency };
}

function bookingTypeForImportedItem(
  item: Pick<ItineraryExportItem, "activityType" | "activitySubtype" | "itemKind">,
): BookingDoc["type"] {
  if (item.activitySubtype === "flight") return "flight";
  if (item.activityType === "travel" || item.itemKind === "travel")
    return "public_transport";
  if (item.activityType === "stay" || item.itemKind === "lodging") return "hotel";
  if (item.activityType === "attraction" || item.itemKind === "activity")
    return "activity_ticket";
  return "other";
}
