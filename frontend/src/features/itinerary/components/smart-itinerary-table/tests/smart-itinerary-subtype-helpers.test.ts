import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  activityTypeOptions,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  travelSubtypeOptions,
} from "../../../domain/itinerary-activity-types";

describe("smart itinerary subtype helpers", () => {
  it("builds inline picker options from localized activity and travel subtypes", () => {
    expect(activityTypeOptions("en")).toHaveLength(7);
    expect(activityTypeOptions("en")[0]).toMatchObject({ value: "travel", label: "Travel" });
    const th = travelSubtypeOptions("th");
    expect(th.map((item) => item.value)).toEqual([
      "flight",
      "train",
      "bus",
      "taxi",
      "ferry",
      "walk",
      "car",
      "shuttle",
    ]);
    expect(th.find((item) => item.value === "flight")?.label).toBe("เครื่องบิน");
  });

  it("builds activity type patch without losing unrelated details", () => {
    const baseItem = buildItineraryItem({
      id: "1",
      day: "2026-06-10",
      startTime: "09:00",
      endTime: "11:00",
      endOffsetDays: 0,
      activity: "Flight",
      activityType: "travel",
      activitySubtype: "flight",
      place: "BKK",
      transportation: "Thai Airways",
      details: {
        subtype: "flight",
        provider: "Thai Airways",
      },
      durationMinutes: 120,
    });

    expect(buildActivityTypePatch(baseItem, "food")).toEqual({
      activityType: "food",
      activitySubtype: null,
      details: {
        provider: "Thai Airways",
      },
    });
  });

  it("builds activity subtype patch without losing unrelated details", () => {
    const baseItem = buildItineraryItem({
      id: "2",
      day: "2026-06-10",
      startTime: "09:00",
      endTime: null,
      endOffsetDays: 0,
      activity: "Airport transfer",
      activityType: "travel",
      activitySubtype: null,
      place: "BKK",
      transportation: "Uber",
      details: {
        notes: "quiet",
      },
      durationMinutes: null,
    });

    expect(buildActivitySubtypePatch(baseItem, "travel", "taxi")).toEqual({
      activityType: "travel",
      activitySubtype: "taxi",
      details: {
        notes: "quiet",
        subtype: "taxi",
      },
    });
  });
});
