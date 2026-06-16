import { describe, expect, it } from "vitest";
import { deriveTripCountriesFromDestination } from "./trip-countries";

describe("trip countries", () => {
  it("derives known countries from destination text", () => {
    expect(
      deriveTripCountriesFromDestination("Hong Kong + Shenzhen", ["Thailand"]),
    ).toEqual(["Hong Kong", "China"]);

    expect(
      deriveTripCountriesFromDestination("Tokyo, Osaka, Japan", []),
    ).toEqual(["Japan"]);

    expect(
      deriveTripCountriesFromDestination("Taipei and Seoul", []),
    ).toEqual(["South Korea", "Taiwan"]);
  });

  it("falls back to existing countries when the destination is unknown", () => {
    expect(
      deriveTripCountriesFromDestination("Mystery island", ["Thailand"]),
    ).toEqual(["Thailand"]);
  });
});
