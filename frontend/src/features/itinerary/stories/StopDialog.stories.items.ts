import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";

export const stopDialogStoryItem = tripFixture.planItems[0];

export function stopDialogCategoryItem(
  overrides: Partial<ItineraryItem>,
): ItineraryItem {
  return {
    ...stopDialogStoryItem,
    ...overrides,
    details: {
      ...stopDialogStoryItem.details,
      ...overrides.details,
    },
  };
}

export const transportationStoryItem = stopDialogCategoryItem({
  activity: "DMK -> HKG",
  activityType: "travel",
  durationMinutes: 175,
  place: "",
  transportation: "Plane",
  details: {
    kind: "transportation",
    origin: "Don Mueang International Airport",
    destination: "Hong Kong International Airport",
    mode: "Plane",
    ticketRef: "FD ticket",
    costNote: "Prepaid group fare",
  },
});

export const activityStoryItem = stopDialogCategoryItem({
  activity: "Dim sum lunch",
  activityType: "experience",
  itemKind: "activity",
  place: "Central Market",
  details: {
    kind: "experience",
    provider: "Central Market",
    meetingPoint: "South entrance",
    bookingRef: "Lunch shortlist",
  },
});

export const foodStoryItem = stopDialogCategoryItem({
  activity: "Dim sum lunch",
  activityType: "food",
  itemKind: "meal",
  place: "Central Market",
  details: {
    kind: "food",
    provider: "Central Market",
    cuisine: "Cantonese dim sum",
    bookingRef: "Lunch shortlist",
    costNote: "HKD 160 per person estimate",
  },
});

export const stayStoryItem = stopDialogCategoryItem({
  activity: "Hotel check-in",
  activityType: "stay",
  itemKind: "lodging",
  place: "The Chow Kit",
  details: {
    kind: "stay",
    entryWindow: "15:00 check-in / 11:00 check-out",
    bookingRef: "WK-2409",
    detail: "Leave bags before the food walk",
  },
});

export const shoppingStoryItem = stopDialogCategoryItem({
  activity: "Sneaker stop",
  activityType: "shopping",
  itemKind: "activity",
  place: "Mong Kok",
  details: {
    kind: "shopping",
    store: "Sneaker Street",
    shoppingList: "Limited colorways, socks, gifts",
    budgetNote: "Cap group browsing at 45 minutes",
  },
});

export const noteTaskStoryItem = stopDialogCategoryItem({
  activity: "Confirm voucher names",
  activityType: "experience",
  itemKind: "note",
  timeMode: "flexible",
  place: "Central Market",
  details: {
    kind: "task",
    detail: "Check passenger names before ticket issue",
    meetingPoint: "Shared booking sheet",
  },
});
