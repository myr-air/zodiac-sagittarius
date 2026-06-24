import { describe, expect, it } from "vitest";

import { readItineraryDetailString } from "@/src/trip/itinerary-items";

describe("itinerary item details", () => {
  it("reads trimmed string details only", () => {
    expect(readItineraryDetailString({ mode: " flight ", count: 2 }, "mode"))
      .toBe("flight");
    expect(readItineraryDetailString({ count: 2 }, "count")).toBe("");
    expect(readItineraryDetailString(null, "mode")).toBe("");
  });
});
