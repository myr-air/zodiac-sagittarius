import { expect } from "vitest";
import type { TripCockpit } from "../api-client";
import { cockpitResponse } from "../testing/api-client-test-utils";
import { pathIdRain } from "../testing/itinerary-path-fixtures";

export function expectLoadedCockpit(cockpit: TripCockpit, tripId: string): void {
  expect(cockpit.trip.id).toBe(tripId);
  expect(cockpit.trip.members.length).toBeGreaterThan(0);
  expect(cockpit.trip.planVariants.length).toBeGreaterThan(0);
  expect(cockpit.trip.tripPlans).toEqual(cockpit.trip.planVariants);
  expect(cockpit.trip.mainTripPlanId).toBe(cockpit.trip.activePlanVariantId);
  expect(cockpit.tasks).toEqual([
    {
      id: cockpitResponse.tasks[0].id,
      tripPlanId: cockpitResponse.planVariants![0].id,
      title: "Buy eSIM",
      status: "open",
      visibility: "private",
      kind: "prep",
      createdBy: cockpitResponse.members[0].id,
      assigneeId: cockpitResponse.members[0].id,
      relatedItemId: null,
      version: 1,
    },
  ]);
  expect(cockpit.stopNotes).toEqual(cockpitResponse.stopNotes);
  expect(cockpit.trip.expenses[0]).toMatchObject({
    id: cockpitResponse.expenses[0].id,
    tripPlanId: cockpitResponse.planVariants![0].id,
    amount: 240,
    splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 240 },
  });
  expect(cockpit.trip.itineraryItems[0]).toMatchObject({
    pathGroupId: "group-breakfast",
    pathId: pathIdRain,
    pathName: "Rain plan",
    pathRole: "alternative",
    endTime: "09:30",
    endOffsetDays: 0,
  });
  expect(cockpit.trip.bookingDocs?.[0]).toMatchObject({
    id: "booking-api-flight",
    tripPlanId: cockpitResponse.planVariants![0].id,
    externalLinks: [{ id: "booking-api-flight-link", label: "Drive", url: "https://drive.google.com/api-flight", provider: "Google Drive" }],
  });
  expect(cockpit.trip.photoAlbumLinks?.[0]).toMatchObject({
    id: "018f4e89-1111-7000-8000-000000000001",
    title: "API group album",
    provider: "google_photos",
  });
  expect(cockpit.expenseSummary).toEqual(cockpitResponse.expenseSummary);
}
