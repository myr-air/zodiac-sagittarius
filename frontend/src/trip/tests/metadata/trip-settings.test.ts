import { describe, expect, it } from "vitest";
import {
  applyTripSettingsToTrip,
  buildShiftedItineraryItemDayRequests,
  buildPatchTripSettingsRequest,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import { seedTrip } from "@/src/trip/seed";

describe("trip settings", () => {
  it("builds API patch requests for trip settings", () => {
    expect(
      buildPatchTripSettingsRequest(
        {
          name: "Updated trip",
          destinationLabel: "Tokyo, Japan",
          countries: ["Japan"],
          startDate: "2026-06-20",
          endDate: "2026-06-25",
          partySize: 4,
          defaultTimezone: "Asia/Tokyo",
        },
        {
          clientMutationId: "mutation-trip-settings",
          expectedVersion: 12,
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-trip-settings",
      expectedVersion: 12,
      name: "Updated trip",
      destinationLabel: "Tokyo, Japan",
      countries: ["Japan"],
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      partySize: 4,
      defaultTimezone: "Asia/Tokyo",
    });
  });

  it("applies local trip settings and shifts itinerary days from the previous start date", () => {
    const nextTrip = applyTripSettingsToTrip(seedTrip, {
      name: "Updated trip",
      destinationLabel: "Tokyo, Japan",
      countries: ["Japan"],
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      partySize: 4,
      defaultTimezone: "Asia/Tokyo",
    });

    expect(nextTrip).toMatchObject({
      name: "Updated trip",
      destinationLabel: "Tokyo, Japan",
      countries: ["Japan"],
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      partySize: 4,
      defaultTimezone: "Asia/Tokyo",
      version: (seedTrip.version ?? 0) + 1,
    });
    expect(nextTrip.itineraryItems[0]?.day).toBe("2026-06-20");
  });

  it("builds itinerary day patch requests for API start date shifts", () => {
    let mutationIndex = 0;
    const items = [
      { ...seedTrip.itineraryItems[0]!, id: "item-a", day: "2026-06-18", version: 2 },
      { ...seedTrip.itineraryItems[1]!, id: "item-b", day: "2026-06-19", version: 3 },
    ];
    const requests = buildShiftedItineraryItemDayRequests(
      items,
      "2026-06-18",
      "2026-06-20",
      (prefix) => `${prefix}-${++mutationIndex}`,
    );

    expect(requests).toEqual(
      [
        {
          itemId: "item-a",
          request: {
            clientMutationId: "itinerary-day-shift-1",
            expectedVersion: 2,
            patch: { day: "2026-06-20" },
          },
        },
        {
          itemId: "item-b",
          request: {
            clientMutationId: "itinerary-day-shift-2",
            expectedVersion: 3,
            patch: { day: "2026-06-21" },
          },
        },
      ],
    );
  });

  it("does not build itinerary day patch requests when the start date is unchanged", () => {
    expect(
      buildShiftedItineraryItemDayRequests(
        seedTrip.itineraryItems,
        seedTrip.startDate,
        seedTrip.startDate,
        () => "unused",
      ),
    ).toEqual([]);
  });

  it("merges API-patched trip settings while preserving the active plan fallback", () => {
    const patchedItem = {
      ...seedTrip.itineraryItems[0]!,
      day: "2026-06-20",
      version: seedTrip.itineraryItems[0]!.version + 1,
    };
    const patchedTrip = {
      ...seedTrip,
      name: "API trip",
      destinationLabel: "Seoul",
      countries: ["South Korea"],
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      partySize: 5,
      defaultTimezone: "Asia/Seoul",
      activePlanVariantId: "",
      version: (seedTrip.version ?? 0) + 3,
    };

    const nextTrip = mergePatchedTripSettings(
      seedTrip,
      patchedTrip,
      new Map([[patchedItem.id, patchedItem]]),
    );

    expect(nextTrip).toMatchObject({
      name: "API trip",
      destinationLabel: "Seoul",
      countries: ["South Korea"],
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      partySize: 5,
      defaultTimezone: "Asia/Seoul",
      activePlanVariantId: seedTrip.activePlanVariantId,
      version: patchedTrip.version,
    });
    expect(
      nextTrip.itineraryItems.find((item) => item.id === patchedItem.id),
    ).toEqual(patchedItem);
  });
});
