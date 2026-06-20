import type {
  BookingDocType,
  ItineraryItem,
} from "./types";

const bookingTitleSuffixByType: Partial<Record<BookingDocType, string>> = {
  activity_ticket: "ticket",
  flight: "flight ticket",
  hotel: "hotel booking",
  other: "booking",
  public_transport: "transport ticket",
  train: "train ticket",
};

const bookingDraftTitleSuffixByType: Partial<Record<BookingDocType, string>> = {
  activity_ticket: "ticket draft",
  flight: "flight ticket draft",
  hotel: "hotel booking draft",
  other: "booking draft",
  public_transport: "transport booking draft",
  train: "train ticket draft",
};

export function bookingTitleForItineraryItem(
  item: ItineraryItem,
  bookingType: BookingDocType,
): string {
  return `${item.activity} ${bookingTitleSuffixByType[bookingType] ?? "booking"}`;
}

export function bookingDraftTitleForItineraryItem(
  item: ItineraryItem,
  bookingType: BookingDocType,
): string {
  return `${item.activity} ${bookingDraftTitleSuffixByType[bookingType] ?? "booking draft"}`;
}
