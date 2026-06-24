import {
  expectStoryElementClasses,
  expectStoryElementPresent,
} from "@/src/shared/storybook/story-assertions";
import { noop } from "@/src/testing/storybook-actions";
import {
  buildTripFixtureItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { TimelineViewProps } from "@/src/features/itinerary/components";
import {
  denseTripFixture,
  emptyTripFixture,
  planABAlternativeItemsBase,
  withStoryPrefix,
} from "./support/itinerary-story-fixtures";

type TimelineStoryArgs = TimelineViewProps;

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

export const denseTimelineItems = denseTripFixture.itineraryItems;
export const emptyTimelineItems = emptyTripFixture.itineraryItems;
export const timelinePlanABAlternativeItems = withStoryPrefix(
  planABAlternativeItemsBase,
  "timeline",
);
export const timelineAdvisoryItems: ItineraryItem[] = [
  buildTripFixtureItineraryItem({
    id: "timeline-advisory-main",
    activity: "Peak tram timed entry",
    advisories: [{ code: "ticket-window", label: "Book timed ticket", severity: "warning" }],
  }),
  buildTripFixtureItineraryItem({
    id: "timeline-advisory-followup",
    activity: "Harbour transfer buffer",
    advisories: [],
  }),
];

export async function expectTimelineStructure(canvasElement: HTMLElement) {
  await expectStoryElementPresent(canvasElement, ".timeline-panel");
  await expectStoryElementClasses(canvasElement, ".timeline-grid", "timeline-grid", "grid", "grid-cols-3");
}
