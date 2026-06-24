import { expect } from "vitest";
import type { TripCockpit } from "../api-client";
import { cockpitResponse } from "../testing/support/api-client-test-utils";

export function expectLoadedCockpit(cockpit: TripCockpit, tripId: string): void {
  expect(cockpit.trip.id).toBe(tripId);
  expect(cockpit.trip.members.length).toBeGreaterThan(0);
  expect(cockpit.trip.planVariants.length).toBeGreaterThan(0);
  expect(cockpit.trip.tripPlans).toEqual(cockpit.trip.planVariants);
  expect(cockpit.trip.mainTripPlanId).toBe(cockpit.trip.activePlanVariantId);
  expect(cockpit.tasks).toEqual(expect.arrayContaining([
    expect.objectContaining({
      id: "018f4e85-2222-7000-8000-000000000002",
      tripPlanId: cockpitResponse.planVariants![0].id,
      title: "Book Peak Tram",
      status: "done",
      visibility: "shared",
      kind: "booking",
      createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac562",
      assigneeId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac562",
      relatedItemId: null,
      version: 1,
    }),
  ]));
  expect(cockpit.stopNotes).toEqual(expect.arrayContaining([
    expect.objectContaining({
      id: "018f4e83-5410-7d8b-8f25-fd52c5e7bd30",
      tripId,
      tripPlanId: cockpitResponse.planVariants![0].id,
      itemId: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
      authorId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac563",
      body: "Meet outside exit B after breakfast",
      version: 1,
    }),
  ]));
  expect(cockpit.trip.expenses[0]).toMatchObject({
    id: cockpitResponse.expenses[0].id,
    tripPlanId: cockpitResponse.planVariants![0].id,
    amount: 240,
    splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 120 },
  });
  expect(cockpit.trip.itineraryItems[0]).toMatchObject({
    id: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
    activity: "Dim Dim Sum",
    startTime: "08:30",
    endTime: null,
    endOffsetDays: 0,
  });
  expect(cockpit.trip.bookingDocs?.[0]).toMatchObject({
    id: "018f4e87-1111-7000-8000-000000000001",
    tripPlanId: cockpitResponse.planVariants![0].id,
    externalLinks: [expect.objectContaining({
      label: "Airline booking",
      url: "https://www.hkexpress.com",
      provider: "HK Express",
    })],
  });
  expect(cockpit.expenseSummary).toEqual({
    groupSpend: 240,
    netByMember: {
      "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 120,
      "018f4e81-77a4-7b8f-b3bd-0d0f493ac563": -120,
    },
    settlementCurrency: "HKD",
    currentUserNetLabel: "You are owed HK$120.00",
    settlementSuggestions: [{
      amount: 120,
      currency: "HKD",
      from: "018f4e81-77a4-7b8f-b3bd-0d0f493ac563",
      to: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      lastRemindedAt: null,
    }],
  });
}
