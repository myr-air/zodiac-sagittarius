import { fn } from "storybook/test";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { pathIdMain } from "@/src/features/itinerary/testing";
import {
  buildPrefixedPathScenarioItems,
  pathNameMain,
  buildOverflowStoryItems,
} from "./support/itinerary-story-fixtures";

export const onStoryChangeDayPath = fn();
export const onStoryMoveItemToPath = fn();
export const onStoryToggleShowAllPaths = fn();
export const onStoryUpdateItemInline = fn();
export const onStoryInlineQuickEdit = fn();

const pagePathScenarioItems = buildPrefixedPathScenarioItems("page");

export const pageBranchGraphItems: ItineraryItem[] =
  pagePathScenarioItems.branchGraphItems;
export const pagePlanAExampleItems: ItineraryItem[] =
  pagePathScenarioItems.planAExampleItems;
export const pageWindowOnlyDurationItems: ItineraryItem[] =
  pagePathScenarioItems.windowOnlyDurationItems;
export const pagePlanABAlternativeItems: ItineraryItem[] =
  pagePathScenarioItems.planABAlternativeItems;
export const pageRequestedPlanExampleItems: ItineraryItem[] =
  pagePathScenarioItems.requestedPlanExampleItems;
export const pageStressPathItems: ItineraryItem[] =
  pagePathScenarioItems.stressPathItems;
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
  return buildOverflowStoryItems(pageStressPathItems, {
    activityDetail: "with long operational copy for page-level overflow validation",
    idPrefix: "page-overflow",
    placeDetail: " - gate notes, booking reference, and meet-up details",
  });
}
