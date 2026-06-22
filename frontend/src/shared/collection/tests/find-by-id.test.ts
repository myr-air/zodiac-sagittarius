import { describe, expect, it } from "vitest";

import { findById } from "../find-by-id";

describe("findById", () => {
  const items = [
    { id: "item-1", label: "First" },
    { id: "item-2", label: "Second" },
  ];

  it("returns the matching item by id", () => {
    expect(findById(items, "item-2")).toEqual({ id: "item-2", label: "Second" });
  });

  it("returns null for missing or empty ids", () => {
    expect(findById(items, "missing-item")).toBeNull();
    expect(findById(items, "")).toBeNull();
    expect(findById(items, null)).toBeNull();
    expect(findById(items, undefined)).toBeNull();
  });
});
