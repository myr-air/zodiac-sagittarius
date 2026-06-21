import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  buildActivitySubtypePatch,
  buildActivityTypePatch,
} from "../itinerary-activity-types";

describe("itinerary-activity-types", () => {
  it("removes travel subtype details when switching away from travel", () => {
    const item = buildItineraryItem({
      activity: "Dinner",
      activityType: "travel",
      activitySubtype: "train",
      details: {
        mode: "train",
        provider: "MTR",
        subtype: "train",
      },
    });

    expect(buildActivityTypePatch(item, "food")).toEqual({
      activityType: "food",
      activitySubtype: null,
      details: {
        provider: "MTR",
      },
    });
  });

  it("keeps unrelated details when setting a travel subtype", () => {
    expect(
      buildActivitySubtypePatch(
        buildItineraryItem({
          activity: "Transfer",
          activityType: "travel",
          activitySubtype: null,
          details: { notes: "quiet car" },
        }),
        "travel",
        "taxi",
      ),
    ).toEqual({
      activityType: "travel",
      activitySubtype: "taxi",
      details: {
        notes: "quiet car",
        subtype: "taxi",
      },
    });
  });
});
