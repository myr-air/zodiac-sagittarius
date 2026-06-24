import { describe, expect, it } from "vitest";

import {
  findById,
  findSelectedOrFirstById,
  mapById,
  mapValueById,
  upsertById,
} from "..";

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

  it("finds the selected id or falls back to the first item", () => {
    expect(findSelectedOrFirstById(items, "item-2")).toEqual({
      id: "item-2",
      label: "Second",
    });
    expect(findSelectedOrFirstById(items, "missing-item")).toEqual({
      id: "item-1",
      label: "First",
    });
    expect(findSelectedOrFirstById([], "missing-item")).toBeNull();
  });

  it("indexes items by id for shared collection replacement flows", () => {
    expect(mapById(items).get("item-2")).toEqual({ id: "item-2", label: "Second" });
    expect(mapValueById(items, (item) => item.label).get("item-2")).toBe("Second");
  });

  it("replaces existing ids and appends new ids without mutating inputs", () => {
    const current = [
      { id: "item-1", label: "Original" },
      { id: "item-2", label: "Stable" },
    ];
    const next = [
      { id: "item-1", label: "Updated" },
      { id: "item-3", label: "New" },
    ];

    expect(upsertById(current, next)).toEqual([
      { id: "item-1", label: "Updated" },
      { id: "item-2", label: "Stable" },
      { id: "item-3", label: "New" },
    ]);
    expect(current[0]).toEqual({ id: "item-1", label: "Original" });
    expect(upsertById(current, [])).toBe(current);
  });
});
