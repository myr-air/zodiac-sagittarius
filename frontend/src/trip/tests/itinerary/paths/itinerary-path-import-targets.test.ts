import { describe, expect, it } from "vitest";
import { applyImportedItemsToItineraryPath } from "../../../itinerary-paths";
import {
  buildItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import { importItem } from "./itinerary-path-imports.test-support";
import { pathIdRain } from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

describe("itinerary path import targets", () => {
  it("imports into a selected draft Trip Plan without switching the Main Plan", () => {
    const draftTripPlanId = "plan-selected-draft";
    const importedBlock = {
      ...importItem,
      id: "import-journey-block",
      day: "2026-06-20",
      sortOrder: 100,
      activity: "Flight to Hong Kong",
      isPlanBlock: true,
      parentItemId: null,
    };
    const importedChild = {
      ...importItem,
      id: "import-checkin",
      day: "2026-06-20",
      sortOrder: 200,
      activity: "Airport check-in",
      parentItemId: "import-journey-block",
      isPlanBlock: false,
    };
    const trip = {
      ...tripFixture.trip,
      mainTripPlanId: tripFixture.trip.activePlanVariantId,
      tripPlans: [
        ...(tripFixture.trip.tripPlans ?? tripFixture.trip.planVariants),
        {
          id: draftTripPlanId,
          tripId: tripFixture.trip.id,
          name: "Client proposal",
          kind: "draft" as const,
          status: "draft" as const,
          description: "Draft plan for review",
          version: 1,
        },
      ],
      itineraryItems: [],
    };

    const next = applyImportedItemsToItineraryPath(
      trip,
      [importedBlock, importedChild],
      {
        memberId: "member-aom",
        tripPlanId: draftTripPlanId,
        pathId: "main",
        pathName: "Main",
        scope: "trip",
        mode: "keep-alternatives",
        recordMode: "clone-linked",
      },
    );
    const imported = next.itineraryItems.filter((item) =>
      item.id.startsWith("import-"),
    );

    expect(next.mainTripPlanId).toBe(trip.mainTripPlanId);
    expect(next.activePlanVariantId).toBe(trip.activePlanVariantId);
    expect(imported).toHaveLength(2);
    expect(imported.map((item) => item.planVariantId)).toEqual([
      draftTripPlanId,
      draftTripPlanId,
    ]);
    expect(
      next.itineraryItems.find((item) => item.id === "import-checkin"),
    ).toMatchObject({
      parentItemId: "import-journey-block",
      planVariantId: draftTripPlanId,
    });
  });

  it("replaces only the selected target path and keeps other paths", () => {
    const existingRain = buildItineraryItem({
      id: "existing-rain",
      tripId: tripFixture.trip.id,
      planVariantId: tripFixture.trip.activePlanVariantId,
      day: "2026-06-19",
      pathGroupId: "group-breakfast",
      pathId: pathIdRain,
      pathRole: "alternative" as const,
    });
    const existingSlow = {
      ...existingRain,
      id: "existing-slow",
      pathId: "path-slow",
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [existingRain, existingSlow],
      itineraryPaths: [
        {
          id: pathIdRain,
          tripId: tripFixture.trip.id,
          name: "Rain plan",
          scope: "day" as const,
          day: "2026-06-19",
          createdBy: "member-aom",
          createdAt: "2026-06-04T00:00:00.000Z",
          updatedAt: "2026-06-04T00:00:00.000Z",
        },
      ],
    };

    const next = applyImportedItemsToItineraryPath(trip, [importItem], {
      memberId: "member-aom",
      pathId: pathIdRain,
      pathName: "Rain plan",
      scope: "day",
      day: "2026-06-19",
      mode: "replace-target",
      recordMode: "clone-linked",
    });

    expect(next.itineraryItems.map((item) => item.id)).toEqual([
      "existing-slow",
      "import-rain-museum",
    ]);
  });
});
