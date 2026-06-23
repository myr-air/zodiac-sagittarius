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

export const appViewportStories = {
  desktop1024Bookings: appViewportStory(
    "bookings",
    "desktop1024",
    expectBookingsView,
  ),
  desktop1024Expenses: appViewportStory(
    "expenses",
    "desktop1024",
    expectExpensesView,
  ),
  desktop1024Itinerary: appViewportStory(
    "itinerary",
    "desktop1024",
    expectItineraryView,
  ),
  desktop1024Map: appViewportStory("map", "desktop1024", expectMapView),
  desktop1024Members: appViewportStory(
    "members",
    "desktop1024",
    expectMembersView,
  ),
  desktop1024Overview: appViewportStory(
    "overview",
    "desktop1024",
    expectDesktopOverviewWorkspace,
  ),
  desktop1024Photos: appViewportStory(
    "photos",
    "desktop1024",
    expectPhotosView,
  ),
  desktop1024Settings: appViewportStory(
    "settings",
    "desktop1024",
    expectSettingsView,
  ),
  desktop1024Timeline: appViewportStory(
    "timeline",
    "desktop1024",
    expectTimelineView,
  ),
  desktop1440Bookings: appViewportStory(
    "bookings",
    "desktop1440",
    expectBookingsView,
  ),
  desktop1440Expenses: appViewportStory(
    "expenses",
    "desktop1440",
    expectExpensesView,
  ),
  desktop1440Itinerary: appViewportStory(
    "itinerary",
    "desktop1440",
    expectItineraryView,
  ),
  desktop1440Map: appViewportStory("map", "desktop1440", expectMapView),
  desktop1440Members: appViewportStory(
    "members",
    "desktop1440",
    expectMembersView,
  ),
  desktop1440Overview: appViewportStory(
    "overview",
    "desktop1440",
    expectDesktopOverviewWorkspace,
  ),
  desktop1440Photos: appViewportStory(
    "photos",
    "desktop1440",
    expectPhotosView,
  ),
  desktop1440Settings: appViewportStory(
    "settings",
    "desktop1440",
    expectSettingsView,
  ),
  desktop1440Timeline: appViewportStory(
    "timeline",
    "desktop1440",
    expectTimelineView,
  ),
  mobileBookings: appViewportStory("bookings", "mobile320", expectBookingsView),
  mobileExpenses: appViewportStory("expenses", "mobile320", expectExpensesView),
  mobileItinerary: appViewportStory(
    "itinerary",
    "mobile320",
    expectItineraryView,
  ),
  mobileMap: appViewportStory("map", "mobile320", expectMapView),
  mobileMembers: appViewportStory("members", "mobile320", expectMembersView),
  mobileOverview: appViewportStory("overview", "mobile320", expectOverviewView),
  mobilePhotos: appViewportStory("photos", "mobile320", expectPhotosView),
  mobileSettings: appViewportStory("settings", "mobile320", expectSettingsView),
  mobileTimeline: appViewportStory("timeline", "mobile320", expectTimelineView),
  tabletBookings: appViewportStory("bookings", "tablet768", expectBookingsView),
  tabletExpenses: appViewportStory("expenses", "tablet768", expectExpensesView),
  tabletItinerary: appViewportStory(
    "itinerary",
    "tablet768",
    expectItineraryView,
  ),
  tabletMap: appViewportStory("map", "tablet768", expectMapView),
  tabletMembers: appViewportStory("members", "tablet768", expectMembersView),
  tabletOverview: appViewportStory("overview", "tablet768", expectOverviewView),
  tabletPhotos: appViewportStory("photos", "tablet768", expectPhotosView),
  tabletSettings: appViewportStory("settings", "tablet768", expectSettingsView),
  tabletTimeline: appViewportStory("timeline", "tablet768", expectTimelineView),
} satisfies Record<string, SagittariusAppStory>;
