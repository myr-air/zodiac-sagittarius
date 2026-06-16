import { describe, expect, it } from "vitest";
import {
  applyTripSettingsToTrip,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import { seedTrip } from "@/src/trip/seed";

describe("trip settings", () => {
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
