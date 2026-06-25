import { describe, expect, it } from "vitest";
import { placeAutocompleteSuggestions } from "@/src/trip/places";
import { seedTrip } from "@/src/trip/seed";

describe("place autocomplete suggestions", () => {
  it("scopes airport, station, and landmark suggestions to explicit trip cities", () => {
    const suggestions = placeAutocompleteSuggestions(seedTrip);
    const values = suggestions.map((suggestion) => suggestion.value);

    expect(values).toContain("HKG Hong Kong International Airport");
    expect(values).toContain("Hong Kong West Kowloon Station");
    expect(values).toContain("SZX Shenzhen Bao'an International Airport");
    expect(values).toContain("Shenzhen North Railway Station");
    expect(values).toContain("Victoria Peak Hong Kong");
    expect(values.some((value) => /Shanghai|Beijing|Paris/i.test(value))).toBe(false);
  });

  it("filters scoped pickup suggestions by typed query", () => {
    const suggestions = placeAutocompleteSuggestions(seedTrip, "north station");

    expect(suggestions.map((suggestion) => suggestion.value)).toEqual([
      "Shenzhen North Railway Station",
    ]);
  });

  it("falls back to country cities only when no explicit city is known", () => {
    const suggestions = placeAutocompleteSuggestions({
      destinationLabel: "Japan",
      countries: ["Japan"],
    });
    const values = suggestions.map((suggestion) => suggestion.value);

    expect(values).toContain("TYO Tokyo Airport");
    expect(values).toContain("OSA Osaka Airport");
    expect(values.some((value) => /Hong Kong|Bangkok/i.test(value))).toBe(false);
  });
});
