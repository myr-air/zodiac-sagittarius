import { describe, expect, it } from "vitest";
import {
  citySuggestions,
  customTripCity,
  destinationMetaParts,
  destinationRouteCode,
  tripDestinationCards,
} from "./account-trip-destinations";

describe("account trip destination helpers", () => {
  it("builds destination cards and parses metadata", () => {
    const card = tripDestinationCards(["Japan"], ["Tokyo"], "en")[0];
    expect(card).toMatchObject({
      title: "Tokyo",
      detail: "Japan",
      meta: "Asia/Tokyo · JPY",
      nights: "2 nights",
      countryName: "Japan",
    });
    expect(destinationMetaParts(card.meta)).toEqual(["Asia/Tokyo", "JPY"]);
  });

  it("suggests known cities while excluding selected cities", () => {
    expect(citySuggestions("tok", []).map((city) => city.city)).toContain("Tokyo");
    expect(citySuggestions("tok", [{ city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 }]).map((city) => city.city)).not.toContain("Tokyo");
  });

  it("resolves route codes and custom city fallbacks", () => {
    expect(destinationRouteCode(["Thailand", "Tokyo"])).toBe("TYO");
    expect(destinationRouteCode(["Japan"])).toBe("JP");
    expect(destinationRouteCode(["Narnia"])).toBe("NAR");
    expect(customTripCity("Narnia", { city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 13.7563, longitude: 100.5018 })).toMatchObject({
      city: "Narnia",
      country: "Thailand",
      countryCode: "TH",
    });
  });
});
