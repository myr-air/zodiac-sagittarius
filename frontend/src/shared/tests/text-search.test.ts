import { describe, expect, it } from "vitest";

import {
  normalizeSearchQuery,
  textMatchesSearchQuery,
  valuesMatchSearchQuery,
} from "../text-search";

describe("text search helpers", () => {
  it("normalizes nullable search queries", () => {
    expect(normalizeSearchQuery("  Hotel  ")).toBe("hotel");
    expect(normalizeSearchQuery("")).toBe("");
    expect(normalizeSearchQuery(null)).toBe("");
    expect(normalizeSearchQuery(undefined)).toBe("");
  });

  it("matches values with a normalized query", () => {
    const query = normalizeSearchQuery("GROUP");

    expect(textMatchesSearchQuery("Shared group album", query)).toBe(true);
    expect(textMatchesSearchQuery("Private album", query)).toBe(false);
    expect(textMatchesSearchQuery(null, query)).toBe(false);
  });

  it("treats an empty normalized query as matching a value list", () => {
    expect(valuesMatchSearchQuery([], "")).toBe(true);
    expect(valuesMatchSearchQuery(["BKK to HKG"], "hkg")).toBe(true);
    expect(valuesMatchSearchQuery(["BKK to HKG"], "hotel")).toBe(false);
  });
});
