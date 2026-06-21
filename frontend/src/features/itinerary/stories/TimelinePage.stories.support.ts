import { expect } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { TimelineView } from "@/src/features/itinerary/components";
import { planABAlternativeItemsBase, withStoryPrefix } from "./support/itinerary-story-fixtures";

type TimelineStoryArgs = Parameters<typeof TimelineView>[0];

export const timelineOwnerStoryArgs = {
  contextRailOpen: false,
  endDate: tripFixture.trip.endDate,
  items: tripFixture.planItems,
  selectedItemId: "item-dimdim",
  startDate: tripFixture.trip.startDate,
  tripName: tripFixture.trip.name,
  onSelectItem: noop,
  onToggleContextRail: noop,
} satisfies TimelineStoryArgs;

export const denseTimelineItems = buildDenseTripFixture().itineraryItems;
export const emptyTimelineItems = buildEmptyTripFixture().itineraryItems;
export const timelinePlanABAlternativeItems = withStoryPrefix(
  planABAlternativeItemsBase,
  "timeline",
);
export const timelineAdvisoryItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "timeline-advisory-main",
    activity: "Peak tram timed entry",
    advisories: [{ code: "ticket-window", label: "Book timed ticket", severity: "warning" }],
  },
  {
    ...tripFixture.planItems[1],
    id: "timeline-advisory-followup",
    activity: "Harbour transfer buffer",
    advisories: [],
  },
];

export async function expectTimelineStructure(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".timeline-panel")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".timeline-grid")).toHaveClass("timeline-grid", "grid", "grid-cols-3");
}
