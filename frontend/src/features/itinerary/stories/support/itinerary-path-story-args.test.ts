import { describe, expect, it } from "vitest";
import { planAPathOptions } from "./itinerary-story-fixtures";
import { buildItineraryStoryItem } from "./itinerary-story-item-builders";
import { buildVisiblePathStoryArgs } from "./itinerary-path-story-args";

describe("itinerary path story args", () => {
  it("uses story items as graph items and shows all paths by default", () => {
    const items = [
      buildItineraryStoryItem(0, {
        id: "path-main",
      }),
    ];

    expect(
      buildVisiblePathStoryArgs(items, "path-main", planAPathOptions),
    ).toEqual({
      graphItems: items,
      items,
      pathOptions: planAPathOptions,
      selectedItemId: "path-main",
      showAllPaths: true,
    });
  });

  it("keeps explicit graph items and show-all-paths overrides", () => {
    const items = [
      buildItineraryStoryItem(0, {
        id: "path-main",
      }),
    ];
    const graphItems = [
      buildItineraryStoryItem(1, {
        id: "graph-main",
      }),
    ];

    expect(
      buildVisiblePathStoryArgs(items, "path-main", planAPathOptions, {
        graphItems,
        showAllPaths: false,
      }),
    ).toMatchObject({
      graphItems,
      items,
      selectedItemId: "path-main",
      showAllPaths: false,
    });
  });
});
