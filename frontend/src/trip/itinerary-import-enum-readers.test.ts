import { describe, expect, it } from "vitest";
import {
  readActivityType,
  readOptionalActivitySubtype,
  readOptionalItemKind,
  readOptionalPathRole,
  readOptionalPriority,
  readOptionalStatus,
  readOptionalTimeMode,
} from "./itinerary-import-enum-readers";

describe("itinerary import enum readers", () => {
  it("reads itinerary item enum values from the canonical itinerary type values", () => {
    expect(readActivityType("travel")).toBe("travel");
    expect(readOptionalActivitySubtype("flight")).toBe("flight");
    expect(readOptionalItemKind("foodRecommendation")).toBe("foodRecommendation");
    expect(readOptionalTimeMode("flexible")).toBe("flexible");
    expect(readOptionalStatus("confirmed")).toBe("confirmed");
    expect(readOptionalPriority("must")).toBe("must");
    expect(readOptionalPathRole({ pathRole: "alternative" }, "pathRole")).toBe(
      "alternative",
    );
  });

  it("keeps optional enum fields absent for nullish import values", () => {
    expect(readOptionalActivitySubtype(undefined)).toBeUndefined();
    expect(readOptionalItemKind(null)).toBeUndefined();
    expect(readOptionalTimeMode(undefined)).toBeUndefined();
    expect(readOptionalStatus(null)).toBeUndefined();
    expect(readOptionalPriority(undefined)).toBeUndefined();
    expect(readOptionalPathRole({ pathRole: null }, "pathRole")).toBeUndefined();
  });

  it("rejects unsupported imported enum values", () => {
    expect(() => readActivityType("museum")).toThrow("Unsupported itinerary import file.");
    expect(() => readOptionalActivitySubtype("plane")).toThrow(
      "Unsupported itinerary import file.",
    );
    expect(() => readOptionalItemKind("photo")).toThrow(
      "Unsupported itinerary import file.",
    );
    expect(() => readOptionalPathRole({ pathRole: "backup" }, "pathRole")).toThrow(
      "Unsupported itinerary import file.",
    );
  });
});
