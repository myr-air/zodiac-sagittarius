import { describe, expect, it } from "vitest";
import {
  citySuggestions,
  destinationMetaParts,
  destinationRouteCode,
  tripContinentValues,
  tripDestinationCards,
} from "../account-trip-destinations";

describe("account trip destination helpers", () => {
  it("re-exports trip destination helpers for account trip wizard callers", () => {
    expect(tripContinentValues).toEqual([
      "all",
      "asia",
      "europe",
      "north-america",
      "south-america",
      "oceania",
      "africa",
    ]);

    const card = tripDestinationCards(["Japan"], ["Tokyo"], "en")[0];
    expect(card).toMatchObject({
      title: "Tokyo",
      detail: "Japan",
      meta: "Asia/Tokyo · JPY",
      nights: "2 nights",
      countryName: "Japan",
    });
    expect(destinationMetaParts(card.meta)).toEqual(["Asia/Tokyo", "JPY"]);

    expect(citySuggestions("tok", []).map((city) => city.city)).toContain("Tokyo");
    expect(destinationRouteCode(["Thailand", "Tokyo"])).toBe("TYO");
  });
});
