import { describe, expect, it } from "vitest";

import {
  normalizeSearchQuery,
  textEqualsNormalizedQuery,
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

  it("compares values against a normalized query", () => {
    const query = normalizeSearchQuery(" Tokyo ");

    expect(textEqualsNormalizedQuery("tokyo", query)).toBe(true);
    expect(textEqualsNormalizedQuery("Tokyo", query)).toBe(true);
    expect(textEqualsNormalizedQuery("Kyoto", query)).toBe(false);
    expect(textEqualsNormalizedQuery(null, query)).toBe(false);
  });

  it("treats an empty normalized query as matching a value list", () => {
    expect(valuesMatchSearchQuery([], "")).toBe(true);
    expect(valuesMatchSearchQuery(["BKK to HKG"], "hkg")).toBe(true);
    expect(valuesMatchSearchQuery(["BKK to HKG"], "hotel")).toBe(false);
  });
});
