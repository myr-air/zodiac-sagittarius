import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  normalizeTravelSubtype,
  travelSubtypeForItem,
  withoutTravelSubtypeDetails,
} from "../itinerary-travel-subtypes";

describe("itinerary travel subtypes", () => {
  it("normalizes explicit and inferred travel subtypes", () => {
    expect(normalizeTravelSubtype("plane")).toBe("flight");
    expect(normalizeTravelSubtype("MTR")).toBe("train");
    expect(normalizeTravelSubtype("unknown")).toBeNull();

    expect(
      travelSubtypeForItem(
        buildItineraryItem({
          activity: "Airport shuttle",
          activityType: "travel",
          activitySubtype: null,
          transportation: "Hotel shuttle",
          details: {},
        }),
      ),
    ).toBe("shuttle");
  });

  it("removes travel subtype details without dropping unrelated metadata", () => {
    expect(
      withoutTravelSubtypeDetails({
        mode: "train",
        provider: "MTR",
        subtype: "train",
      }),
    ).toEqual({
      provider: "MTR",
    });
  });
});
