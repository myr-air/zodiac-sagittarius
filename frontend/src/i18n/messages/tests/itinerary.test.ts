import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";

describe("itinerary messages", () => {
  it("provides English summary breakdown labels", () => {
    expect(messages.en.itinerary.subActivitiesCount({ count: 1 })).toBe(
      "1 sub-activity",
    );
    expect(messages.en.itinerary.subActivitiesCount({ count: 5 })).toBe(
      "5 sub-activities",
    );
    expect(messages.en.itinerary.flexibleItemsCount({ count: 1 })).toBe(
      "1 flexible item",
    );
    expect(messages.en.itinerary.flexibleItemsCount({ count: 3 })).toBe(
      "3 flexible items",
    );
  });
});
