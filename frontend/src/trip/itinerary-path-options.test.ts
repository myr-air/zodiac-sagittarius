import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  deriveItineraryPathOptions,
  itineraryPathOptionsForDay,
} from "./itinerary-path-options";
import {
  pathIdPlanA,
  pathIdRain,
  pathNamePlanA,
  pathNameRain,
} from "./testing/itinerary-path-fixtures";

describe("itinerary path options", () => {
  it("derives main and named path options from metadata and item fields", () => {
    const rainPath = {
      id: pathIdRain,
      tripId: seedTrip.id,
      name: pathNameRain,
      scope: "day" as const,
      day: "2025-05-16",
      createdBy: "member-aom",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    };
    const slowItem = {
      ...seedTrip.itineraryItems[0],
      pathId: "path-slow",
      pathName: "Slow morning",
      pathRole: "alternative" as const,
    };

    expect(deriveItineraryPathOptions([slowItem], [rainPath])).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: pathIdRain, name: pathNameRain, scope: "day", day: "2025-05-16" },
      { id: "path-slow", name: "Slow morning", scope: "trip" },
    ]);
  });

  it("derives generated activity sub plans as day-scoped path options", () => {
    const planAItem = {
      ...seedTrip.itineraryItems[0],
      day: "2026-06-19",
      pathGroupId: "path-group-morning",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative" as const,
    };

    expect(deriveItineraryPathOptions([planAItem])).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: pathIdPlanA, name: pathNamePlanA, scope: "day", day: "2026-06-19" },
    ]);
  });

  it("filters path options to visible day scope", () => {
    const options: Parameters<typeof itineraryPathOptionsForDay>[0] = [
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "plan-b", name: "Plan B", scope: "day", day: "2026-06-19" },
      { id: "day-plan", name: "Day Plan", scope: "day", day: "2026-06-20" },
    ];

    expect(itineraryPathOptionsForDay(options, "2026-06-19")).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "plan-b", name: "Plan B", scope: "day", day: "2026-06-19" },
    ]);
    expect(itineraryPathOptionsForDay(options, "2026-06-20")).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "day-plan", name: "Day Plan", scope: "day", day: "2026-06-20" },
    ]);
  });
});
