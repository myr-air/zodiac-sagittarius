import {
  expectBookingsView,
  expectBudgetView,
  expectDesktopOverviewWorkspace,
  expectDetailPlannerView,
  expectDreamerView,
  expectExpensesView,
  expectFlexibleHunterView,
  expectGroupWranglerView,
  expectItineraryView,
  expectMapView,
  expectMembersView,
  expectOnTripCompanionView,
  expectOverviewView,
  expectPhotosView,
  expectRouteBuilderView,
  expectSettingsView,
  expectTimelineView,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-expectations";
import {
  appViewportStory,
  type SagittariusAppStory,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-story-builders";
import type { PlanningView } from "@/src/trip/workspace/planning-view";

type SagittariusViewport = "mobile320" | "tablet768" | "desktop1024" | "desktop1440";
type ViewportStoryPrefix = "mobile" | "tablet" | "desktop1024" | "desktop1440";
type ViewStorySuffix = Capitalize<PlanningView>;
type ViewportStoryKey = `${ViewportStoryPrefix}${ViewStorySuffix}`;
type StoryPlay = NonNullable<SagittariusAppStory["play"]>;

const appViewportStoryViewOrder = [
  "overview",
  "itinerary",
  "timeline",
  "map",
  "members",
  "expenses",
  "bookings",
  "photos",
  "settings",
  "budget",
  "dreamer",
  "flexible-hunter",
  "route-builder",
  "detail-planner",
  "group-wrangler",
  "on-trip-companion",
] as const satisfies readonly PlanningView[];

const appViewportStoryViewSuffixes = {
  bookings: "Bookings",
  budget: "Budget",
  "detail-planner": "Detail-planner",
  dreamer: "Dreamer",
  expenses: "Expenses",
  "flexible-hunter": "Flexible-hunter",
  "group-wrangler": "Group-wrangler",
  itinerary: "Itinerary",
  map: "Map",
  members: "Members",
  "on-trip-companion": "On-trip-companion",
  overview: "Overview",
  photos: "Photos",
  "route-builder": "Route-builder",
  settings: "Settings",
  timeline: "Timeline",
} as const satisfies Record<PlanningView, ViewStorySuffix>;

const appViewportStoryViewExpectations = {
  bookings: expectBookingsView,
  budget: expectBudgetView,
  "detail-planner": expectDetailPlannerView,
  dreamer: expectDreamerView,
  expenses: expectExpensesView,
  "flexible-hunter": expectFlexibleHunterView,
  "group-wrangler": expectGroupWranglerView,
  itinerary: expectItineraryView,
  map: expectMapView,
  members: expectMembersView,
  "on-trip-companion": expectOnTripCompanionView,
  overview: expectOverviewView,
  photos: expectPhotosView,
  "route-builder": expectRouteBuilderView,
  settings: expectSettingsView,
  timeline: expectTimelineView,
} as const satisfies Record<PlanningView, StoryPlay>;

const appViewportStorySpecs = [
  {
    keyPrefix: "desktop1024",
    viewport: "desktop1024",
    viewExpectations: {
      ...appViewportStoryViewExpectations,
      overview: expectDesktopOverviewWorkspace,
    },
  },
  {
    keyPrefix: "desktop1440",
    viewport: "desktop1440",
    viewExpectations: appViewportStoryViewExpectations,
  },
  {
    keyPrefix: "tablet",
    viewport: "tablet768",
    viewExpectations: appViewportStoryViewExpectations,
  },
  {
    keyPrefix: "mobile",
    viewport: "mobile320",
    viewExpectations: appViewportStoryViewExpectations,
  },
] as const satisfies readonly {
  keyPrefix: ViewportStoryPrefix;
  viewport: SagittariusViewport;
  viewExpectations: Record<PlanningView, StoryPlay>;
}[];

function buildAppViewportStories() {
  return Object.fromEntries(
    appViewportStorySpecs.flatMap(({ keyPrefix, viewport, viewExpectations }) =>
      appViewportStoryViewOrder.map((view) => [
        `${keyPrefix}${appViewportStoryViewSuffixes[view]}`,
        appViewportStory(view, viewport, viewExpectations[view]),
      ]),
    ),
  ) as Record<ViewportStoryKey, SagittariusAppStory>;
}

export const appViewportStories = buildAppViewportStories();
