import {
  expectBookingsView,
  expectDesktopOverviewWorkspace,
  expectExpensesView,
  expectItineraryView,
  expectMapView,
  expectMembersView,
  expectOverviewView,
  expectPhotosView,
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
] as const satisfies readonly PlanningView[];

const appViewportStoryViewSuffixes = {
  bookings: "Bookings",
  expenses: "Expenses",
  itinerary: "Itinerary",
  map: "Map",
  members: "Members",
  overview: "Overview",
  photos: "Photos",
  settings: "Settings",
  timeline: "Timeline",
} as const satisfies Record<PlanningView, ViewStorySuffix>;

const appViewportStoryViewExpectations = {
  bookings: expectBookingsView,
  expenses: expectExpensesView,
  itinerary: expectItineraryView,
  map: expectMapView,
  members: expectMembersView,
  overview: expectOverviewView,
  photos: expectPhotosView,
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
