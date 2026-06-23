import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  expectBookingsView,
  expectDesktopOverviewWorkspace,
  expectExpensesView,
  expectItineraryView,
  expectMapView,
  expectMembersView,
  expectOverviewView,
  expectOwnerWorkspace,
  expectPhotosView,
  expectReadOnlyItineraryWorkspace,
  expectSettingsView,
  expectThaiOwnerWorkspace,
  expectTimelineView,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-expectations";
import {
  denseTrip,
  emptyTrip,
  travelerMemberId,
  viewerMemberId,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-fixtures";
import { appRouteStories } from "@/src/trip/workspace/sagittarius-app/support/storybook-route-stories";
import {
  appViewportStory,
  appViewStory,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-story-builders";

const meta = {
  title: "Sagittarius/App",
  component: SagittariusApp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SagittariusApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
export const ApiJoin: Story = appRouteStories.apiJoin;
export const JoinWithSeedCredentials: Story = appRouteStories.joinWithSeedCredentials;
export const PublicEntry: Story = appRouteStories.publicEntry;
export const AccountLogin: Story = appRouteStories.accountLogin;
export const AccountRegister: Story = appRouteStories.accountRegister;
export const AccountPortal: Story = appRouteStories.accountPortal;
export const AccountPortalMyTrips: Story = appRouteStories.accountPortalMyTrips;
export const AccountPortalNewTrip: Story = appRouteStories.accountPortalNewTrip;
export const AccountPortalExplorer: Story = appRouteStories.accountPortalExplorer;
export const AccountPortalToDos: Story = appRouteStories.accountPortalToDos;
export const AccountPortalVault: Story = appRouteStories.accountPortalVault;
export const AccountPortalSettings: Story = appRouteStories.accountPortalSettings;
export const AccountPortalSignOut: Story = appRouteStories.accountPortalSignOut;
export const AccountTrips: Story = appRouteStories.accountTrips;
export const AccountNewTrip: Story = appRouteStories.accountNewTrip;
export const TripAccess: Story = appRouteStories.tripAccess;
export const TripAccessWithJoinCode: Story = appRouteStories.tripAccessWithJoinCode;
export const TripOverviewAccess: Story = appRouteStories.tripOverviewAccess;
export const TripItineraryAccess: Story = appRouteStories.tripItineraryAccess;
export const TripMapAccess: Story = appRouteStories.tripMapAccess;
export const TripTimelineAccess: Story = appRouteStories.tripTimelineAccess;
export const TripMembersAccess: Story = appRouteStories.tripMembersAccess;
export const Owner: Story = {
  args: { initialView: "overview" },
  play: expectOwnerWorkspace,
};
export const OwnerThai: Story = {
  args: { initialView: "overview" },
  parameters: { locale: "th" },
  play: expectThaiOwnerWorkspace,
};
export const Traveler: Story = {
  args: { initialView: "itinerary", initialMemberId: travelerMemberId },
  play: expectReadOnlyItineraryWorkspace,
};
export const Viewer: Story = {
  args: { initialView: "itinerary", initialMemberId: viewerMemberId },
  play: expectReadOnlyItineraryWorkspace,
};
export const Desktop1024Overview: Story = appViewportStory(
  "overview",
  "desktop1024",
  expectDesktopOverviewWorkspace,
);
export const Desktop1440Overview: Story = appViewportStory("overview", "desktop1440", expectDesktopOverviewWorkspace);
export const Desktop1024Itinerary: Story = appViewportStory("itinerary", "desktop1024", expectItineraryView);
export const Desktop1440Itinerary: Story = appViewportStory("itinerary", "desktop1440", expectItineraryView);
export const Desktop1024Timeline: Story = appViewportStory("timeline", "desktop1024", expectTimelineView);
export const Desktop1440Timeline: Story = appViewportStory("timeline", "desktop1440", expectTimelineView);
export const Desktop1024Map: Story = appViewportStory("map", "desktop1024", expectMapView);
export const Desktop1440Map: Story = appViewportStory("map", "desktop1440", expectMapView);
export const Desktop1024Members: Story = appViewportStory("members", "desktop1024", expectMembersView);
export const Desktop1440Members: Story = appViewportStory("members", "desktop1440", expectMembersView);
export const Desktop1024Expenses: Story = appViewportStory("expenses", "desktop1024", expectExpensesView);
export const Desktop1440Expenses: Story = appViewportStory("expenses", "desktop1440", expectExpensesView);
export const Desktop1024Bookings: Story = appViewportStory("bookings", "desktop1024", expectBookingsView);
export const Desktop1440Bookings: Story = appViewportStory("bookings", "desktop1440", expectBookingsView);
export const Desktop1024Photos: Story = appViewportStory("photos", "desktop1024", expectPhotosView);
export const Desktop1440Photos: Story = appViewportStory("photos", "desktop1440", expectPhotosView);
export const Desktop1024Settings: Story = appViewportStory("settings", "desktop1024", expectSettingsView);
export const Desktop1440Settings: Story = appViewportStory("settings", "desktop1440", expectSettingsView);
export const Itinerary: Story = appViewStory("itinerary", expectItineraryView);
export const Timeline: Story = appViewStory("timeline");
export const Map: Story = appViewStory("map");
export const Members: Story = appViewStory("members");
export const Dense: Story = {
  args: { initialTrip: denseTrip, initialView: "overview" },
  play: expectOverviewView,
};
export const Empty: Story = {
  args: { initialTrip: emptyTrip, initialView: "overview" },
  play: expectOverviewView,
};
export const TabletOverview: Story = appViewportStory("overview", "tablet768", expectOverviewView);
export const MobileOverview: Story = appViewportStory("overview", "mobile320", expectOverviewView);
export const TabletItinerary: Story = appViewportStory("itinerary", "tablet768", expectItineraryView);
export const MobileItinerary: Story = appViewportStory("itinerary", "mobile320", expectItineraryView);
export const TabletTimeline: Story = appViewportStory("timeline", "tablet768", expectTimelineView);
export const MobileTimeline: Story = appViewportStory("timeline", "mobile320", expectTimelineView);
export const TabletMap: Story = appViewportStory("map", "tablet768", expectMapView);
export const MobileMap: Story = appViewportStory("map", "mobile320", expectMapView);
export const TabletMembers: Story = appViewportStory("members", "tablet768", expectMembersView);
export const MobileMembers: Story = appViewportStory("members", "mobile320", expectMembersView);
export const TabletExpenses: Story = appViewportStory("expenses", "tablet768", expectExpensesView);
export const MobileExpenses: Story = appViewportStory("expenses", "mobile320", expectExpensesView);
export const TabletBookings: Story = appViewportStory("bookings", "tablet768", expectBookingsView);
export const MobileBookings: Story = appViewportStory("bookings", "mobile320", expectBookingsView);
export const TabletPhotos: Story = appViewportStory("photos", "tablet768", expectPhotosView);
export const MobilePhotos: Story = appViewportStory("photos", "mobile320", expectPhotosView);
export const TabletSettings: Story = appViewportStory("settings", "tablet768", expectSettingsView);
export const MobileSettings: Story = appViewportStory("settings", "mobile320", expectSettingsView);
