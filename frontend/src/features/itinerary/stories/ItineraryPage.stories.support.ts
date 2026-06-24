import { fn } from "storybook/test";
import {
  buildTripFixtureItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { pathIdMain } from "@/src/features/itinerary/testing";
import {
  branchGraphPathOptions,
  buildOwnerStoryArgs,
  buildPrefixedPathScenarioItems,
  pathNameMain,
  buildOverflowStoryItems,
  denseTripFixture,
  emptyTripFixture,
  planABPathOptions,
  planAPathOptions,
  stressPathOptions,
} from "./support/itinerary-story-fixtures";
import { buildVisiblePathStoryArgs } from "./support/itinerary-path-story-args";

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
  buildTripFixtureItineraryItem({
    id: "overlap-peak-tram",
    day: tripFixture.trip.startDate,
    startTime: "09:00",
    durationMinutes: 120,
    sortOrder: 10,
    pathId: pathIdMain,
    pathName: pathNameMain,
    pathRole: "main",
  }),
  buildTripFixtureItineraryItem({
    id: "overlap-dim-sum",
    day: tripFixture.trip.startDate,
    startTime: "09:30",
    durationMinutes: 90,
    sortOrder: 20,
    pathId: pathIdMain,
    pathName: pathNameMain,
    pathRole: "main",
  }),
];

export function buildPageOverflowItems(): ItineraryItem[] {
  return buildOverflowStoryItems(pageStressPathItems, {
    activityDetail: "with long operational copy for page-level overflow validation",
    idPrefix: "page-overflow",
    placeDetail: " - gate notes, booking reference, and meet-up details",
  });
}

export const pageOwnerArgs = buildOwnerStoryArgs({
  onMoveItemToPath: onStoryMoveItemToPath,
  onChangeDayPath: onStoryChangeDayPath,
  onToggleShowAllPaths: onStoryToggleShowAllPaths,
  onUpdateItemInline: onStoryUpdateItemInline,
});

export const pageTimeWindowDurationArgs = {
  items: pageWindowOnlyDurationItems,
  selectedItemId: "page-window-only-duration",
};

export const pageDenseArgs = {
  items: denseTripFixture.itineraryItems,
  selectedItemId: "",
};

export const pageEmptyArgs = {
  items: emptyTripFixture.itineraryItems,
  selectedItemId: "",
};

export const pageOverlapConflictArgs = {
  selectedItemId: "overlap-dim-sum",
  items: pageOverlapConflictItems,
};

export const pagePlanAArgs = buildVisiblePathStoryArgs(
  pagePlanAExampleItems,
  "page-plan-a-main-breakfast",
  planAPathOptions,
);

export const pagePlanABArgs = buildVisiblePathStoryArgs(
  pagePlanABAlternativeItems,
  "page-plan-ab-main-breakfast",
  planABPathOptions,
);

export const pagePathAndDurationArgs = {
  ...buildVisiblePathStoryArgs(pagePlanABAlternativeItems, "page-plan-ab-main-breakfast", planABPathOptions, {
    showAllPaths: false,
  }),
  onChangeDayPath: onStoryChangeDayPath,
  onMoveItemToPath: onStoryMoveItemToPath,
  onToggleShowAllPaths: onStoryToggleShowAllPaths,
  onUpdateItemInline: onStoryUpdateItemInline,
};

export const pageBranchGraphArgs = buildVisiblePathStoryArgs(
  pageBranchGraphItems,
  "page-graph-main",
  branchGraphPathOptions,
);

export const pageRequestedPlanArgs = buildVisiblePathStoryArgs(
  pageRequestedPlanExampleItems,
  "page-requested-main-0800",
  planAPathOptions,
);

export const pageStressPathsArgs = buildVisiblePathStoryArgs(
  pageStressPathItems,
  "page-stress-0800-main",
  stressPathOptions,
);

export const pageTableOverflowArgs = buildVisiblePathStoryArgs(
  buildPageOverflowItems(),
  "page-overflow-page-stress-0800-main",
  stressPathOptions,
  {
    graphItems: pageStressPathItems,
  },
);
