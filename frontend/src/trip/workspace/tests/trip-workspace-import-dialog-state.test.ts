import { describe, expect, it } from "vitest";
import { mainItineraryPathName } from "@/src/trip/itinerary-paths";
import { pathIdRain } from "@/src/trip/testing/fixtures/itinerary-path-fixtures";
import { initialTripWorkspaceImportDialogState } from "../trip-workspace-import-dialog-state";

describe("initialTripWorkspaceImportDialogState", () => {
  it("uses the selected path name and first imported item day", () => {
    expect(
      initialTripWorkspaceImportDialogState({
        currentTripPathId: pathIdRain,
        importedItems: [
          {
            activity: "Museum",
            activityType: "attraction",
            day: "2026-06-19",
            details: {},
            durationMinutes: 60,
            id: "import-museum",
            linkLabel: "",
            mapLink: "",
            note: "",
            place: "Central",
            sortOrder: 100,
            startTime: "10:00",
            transportation: "",
          },
        ],
        pathOptions: [
          { id: "main", name: "Main", scope: "trip" },
          { id: pathIdRain, name: "Rain Route", scope: "trip" },
        ],
        startDate: "2026-06-18",
        tripPlanId: "plan-main",
      }),
    ).toEqual({
      day: "2026-06-19",
      mode: "replace-target",
      pathNameInput: "Rain Route",
      recordMode: "clone-linked",
      scope: "trip",
      targetTripPlanId: "plan-main",
    });
  });

  it("falls back to the main path name and trip start date", () => {
    expect(
      initialTripWorkspaceImportDialogState({
        currentTripPathId: "missing-path",
        importedItems: [],
        pathOptions: [],
        startDate: "2026-06-18",
        tripPlanId: "plan-main",
      }),
    ).toEqual(expect.objectContaining({
      day: "2026-06-18",
      pathNameInput: mainItineraryPathName,
    }));
  });
});
