import { fn } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { pathIdMain } from "@/src/features/itinerary/testing";
import {
  branchGraphItemsBase,
  pathNameMain,
  planAExampleItemsBase,
  planABAlternativeItemsBase,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  windowOnlyDurationItemBase,
  withStoryPrefix,
} from "./support/itinerary-story-fixtures";

export const onStoryChangeDayPath = fn();
export const onStoryMoveItemToPath = fn();
export const onStoryToggleShowAllPaths = fn();
export const onStoryUpdateItemInline = fn();
export const onStoryInlineQuickEdit = fn();

export const pageBranchGraphItems: ItineraryItem[] = withStoryPrefix(
  branchGraphItemsBase,
  "page",
);
export const pagePlanAExampleItems: ItineraryItem[] = withStoryPrefix(
  planAExampleItemsBase,
  "page",
);
export const pageWindowOnlyDurationItems: ItineraryItem[] = withStoryPrefix(
  windowOnlyDurationItemBase,
  "page",
);
export const pagePlanABAlternativeItems: ItineraryItem[] = withStoryPrefix(
  planABAlternativeItemsBase,
  "page",
);
export const pageRequestedPlanExampleItems: ItineraryItem[] = withStoryPrefix(
  requestedPlanExampleItemsBase,
  "page",
);
export const pageStressPathItems: ItineraryItem[] = withStoryPrefix(
  stressPathItemsBase,
  "page",
);
export const pageOverlapConflictItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "overlap-peak-tram",
    day: tripFixture.trip.startDate,
    startTime: "09:00",
    durationMinutes: 120,
    sortOrder: 10,
    pathId: pathIdMain,
    pathName: pathNameMain,
    pathRole: "main",
  },
  {
    ...tripFixture.planItems[1],
    id: "overlap-dim-sum",
    day: tripFixture.trip.startDate,
    startTime: "09:30",
    durationMinutes: 90,
    sortOrder: 20,
    pathId: pathIdMain,
    pathName: pathNameMain,
    pathRole: "main",
  },
];

export function buildPageOverflowItems(): ItineraryItem[] {
  return pageStressPathItems.map((item, index) => ({
    ...item,
    id: `page-overflow-${item.id}`,
    activity: `${item.activity} with long operational copy for page-level overflow validation ${index + 1}`,
    place: `${item.place} - gate notes, booking reference, and meet-up details`,
    transport: "Airport Express transfer with luggage coordination",
  }));
}
