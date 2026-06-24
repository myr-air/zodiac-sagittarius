import { describe, expect, it } from "vitest";
import { groupItemsByDay } from "@/src/trip/itinerary-core";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  buildTimelineViewModel,
  timelineStartTime,
} from "../TimelineView.model";

describe("TimelineView model", () => {
  it("builds grouped timeline summary values from items", () => {
    const items = [
      buildItineraryItem({
        id: "morning",
        day: "2026-06-18",
        durationMinutes: 45,
      }),
      buildItineraryItem({
        id: "evening",
        day: "2026-06-19",
        durationMinutes: 90,
        advisories: [
          { code: "booking_required", label: "Book ahead", severity: "warning" },
        ],
      }),
    ];

    expect(buildTimelineViewModel({ items, locale: "en" })).toMatchObject({
      groups: groupItemsByDay(items),
      primaryRoute: "Test place / Test place",
      totalMinutes: 135,
      warningCount: 1,
    });
  });

  it("uses itinerary view groups and warning count when provided", () => {
    const items = [
      buildItineraryItem({
        id: "morning",
        day: "2026-06-18",
        durationMinutes: 45,
      }),
    ];
    const dayGroups = groupItemsByDay(items);

    expect(
      buildTimelineViewModel({
        items,
        itineraryView: {
          dayGroups,
          routeDayStats: [
            {
              coordinateItemCount: 0,
              day: "2026-06-18",
              itemCount: 1,
              warningCount: 7,
            },
          ],
          sortedItems: items,
          warningCount: 7,
        },
        locale: "en",
      }),
    ).toMatchObject({
      groups: dayGroups,
      warningCount: 7,
    });
  });

  it("keeps timeline start-time fallback in one place", () => {
    expect(timelineStartTime(buildItineraryItem({ startTime: "09:30" }))).toBe(
      "09:30",
    );
    expect(timelineStartTime(buildItineraryItem({ startTime: "" }))).toBe("—");
  });
});
