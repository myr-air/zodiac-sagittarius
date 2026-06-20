import { describe, expect, it } from "vitest";
import type { ItineraryItem } from "@/src/trip/types";
import {
  buildHighlightItems,
  getHighlightImage,
  highlightTone,
  photoBoardEmptyMessage,
} from "./overview-highlights";
import { overviewItem } from "./overview.test-support";

describe("overview highlight helpers", () => {
  it("builds highlight image from activity and type", () => {
    const food = overviewItem({
      id: "food",
      activity: "Brunch at cafe",
      activityType: "food",
      place: "Lan",
    });
    const shopping = overviewItem({
      id: "shop",
      activityType: "shopping",
      activity: "Mong Kok market run",
    });
    const attraction = overviewItem({
      id: "at",
      activityType: "attraction",
      activity: "Victoria Peak",
    });
    const stay = overviewItem({
      id: "stay",
      activityType: "stay",
      activity: "Hotel",
    });

    expect(getHighlightImage(food)).toBe("/landing/auth/photo-dim-sum-brunch.png");
    expect(getHighlightImage(shopping)).toBe("/landing/auth/photo-mong-kok-market.png");
    expect(getHighlightImage(attraction)).toBe("/landing/auth/photo-hong-kong-skyline.png");
    expect(typeof getHighlightImage(stay)).toBe("string");
  });

  it("builds highlight list preferring activity types and fallback to non-travel", () => {
    const items: ItineraryItem[] = [
      overviewItem({ id: "a", sortOrder: 1, activity: "Travel", activityType: "travel", place: "Airport", durationMinutes: null }),
      overviewItem({ id: "b", sortOrder: 2, activity: "Lunch", activityType: "food", place: "A", durationMinutes: 45 }),
      overviewItem({ id: "c", sortOrder: 3, activity: "Museum", activityType: "attraction", place: "B" }),
      overviewItem({ id: "d", sortOrder: 4, activity: "Shop", activityType: "shopping", place: "C", durationMinutes: 30 }),
      overviewItem({ id: "e", sortOrder: 5, activity: "Hotel", activityType: "stay", place: "D" }),
    ];

    const withPreferred = buildHighlightItems(items);
    expect(withPreferred.map((item) => item.id)).toEqual(["b", "c", "d"]);

    const noPreferred = buildHighlightItems([
      items[0]!,
      { ...items[4]!, id: "f" },
    ]);

    expect(noPreferred).toHaveLength(1);
    expect(noPreferred[0]!.id).toBe("f");
  });

  it("translates empty photo board copy and computes highlight tone", () => {
    expect(photoBoardEmptyMessage("ยังไม่มีไฮไลต์ในแผนนี้")).toBe("ยังไม่มีภาพไฮไลต์ในแผนนี้");
    expect(photoBoardEmptyMessage("No highlights in this plan yet.")).toBe("No photo highlights in this plan yet.");
    expect(photoBoardEmptyMessage("No data")).toBe("No data");

    const food = overviewItem({ activityType: "food", id: "h1" });
    const attraction = overviewItem({ activityType: "attraction", id: "h2" });
    const stay = overviewItem({ activityType: "stay", id: "h3" });

    expect(highlightTone(food, 0)).toBe("market");
    expect(highlightTone(attraction, 0)).toBe("harbor");
    expect(highlightTone(attraction, 1)).toBe("city");
    expect(highlightTone(stay, 0)).toBe("coast");
  });
});
