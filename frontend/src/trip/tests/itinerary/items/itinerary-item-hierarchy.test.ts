import { describe, expect, it } from "vitest";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import { hasDescendantItem } from "../../../itinerary-items/itinerary-item-hierarchy";

describe("itinerary item hierarchy helpers", () => {
  it("detects nested descendants through multiple parent levels", () => {
    const parent = {
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-parent",
      parentItemId: null,
    };
    const child = {
      ...getTripFixtureItineraryItem("item-victoria-peak"),
      id: "item-child",
      parentItemId: parent.id,
    };
    const grandchild = {
      ...getTripFixtureItineraryItem("item-pacific-place"),
      id: "item-grandchild",
      parentItemId: child.id,
    };

    expect(hasDescendantItem([parent, child, grandchild], parent.id, grandchild.id)).toBe(true);
    expect(hasDescendantItem([parent, child, grandchild], child.id, parent.id)).toBe(false);
  });

  it("stops descendant checks when bad parent data contains an unrelated cycle", () => {
    const firstItem = {
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-cycle-a",
      parentItemId: "item-cycle-b",
    };
    const secondItem = {
      ...getTripFixtureItineraryItem("item-victoria-peak"),
      id: "item-cycle-b",
      parentItemId: firstItem.id,
    };

    expect(hasDescendantItem([firstItem, secondItem], "item-unrelated", firstItem.id)).toBe(false);
  });
});
