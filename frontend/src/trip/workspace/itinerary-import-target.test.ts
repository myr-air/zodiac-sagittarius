import { describe, expect, it } from "vitest";
import { mainItineraryPathId, mainItineraryPathName } from "@/src/trip/itinerary";
import { pathIdRain } from "../testing/itinerary-path-fixtures";
import { buildItineraryImportApplyTarget } from "./itinerary-import-target";

describe("buildItineraryImportApplyTarget", () => {
  it("reuses existing paths by id or case-insensitive name", () => {
    expect(
      buildItineraryImportApplyTarget({
        day: "2026-06-20",
        memberId: "member-aom",
        mode: "replace-target",
        pathName: "rain route",
        pathOptions: [
          { id: mainItineraryPathId, name: mainItineraryPathName, scope: "trip" },
          { id: pathIdRain, name: "Rain Route", scope: "trip" },
        ],
        recordMode: "clone-linked",
        scope: "day",
        tripPlanId: "plan-rain",
      }),
    ).toEqual({
      day: "2026-06-20",
      memberId: "member-aom",
      mode: "replace-target",
      pathId: pathIdRain,
      pathName: "Rain Route",
      recordMode: "clone-linked",
      scope: "day",
      tripPlanId: "plan-rain",
    });
  });

  it("keeps the main path id and canonical name", () => {
    expect(
      buildItineraryImportApplyTarget({
        memberId: "member-aom",
        mode: "keep-alternatives",
        pathName: "main",
        pathOptions: [],
        recordMode: "activities-only",
        scope: "trip",
        tripPlanId: "plan-main",
      }),
    ).toMatchObject({
      memberId: "member-aom",
      mode: "keep-alternatives",
      pathId: mainItineraryPathId,
      pathName: mainItineraryPathName,
      recordMode: "activities-only",
      scope: "trip",
      tripPlanId: "plan-main",
    });
  });
});
