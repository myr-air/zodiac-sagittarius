import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  expectItineraryView,
  expectOverviewView,
  expectOwnerWorkspace,
  expectReadOnlyItineraryWorkspace,
  expectThaiOwnerWorkspace,
  expectTravelerItineraryWorkspace,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-expectations";
import {
  denseTrip,
  emptyTrip,
  travelerMemberId,
  viewerMemberId,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-fixtures";
import { appRouteStories } from "@/src/trip/workspace/sagittarius-app/support/storybook-route-stories";
import { appViewStory } from "@/src/trip/workspace/sagittarius-app/support/storybook-story-builders";
import { appViewportStories } from "@/src/trip/workspace/sagittarius-app/support/storybook-viewport-stories";

const meta = {
  title: "Sagittarius/App",
  component: SagittariusApp,
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "off",
    },
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
  play: expectTravelerItineraryWorkspace,
};
export const Viewer: Story = {
  args: { initialView: "itinerary", initialMemberId: viewerMemberId },
  play: expectReadOnlyItineraryWorkspace,
};
export const Desktop1024Overview: Story = appViewportStories.desktop1024Overview;
export const Desktop1440Overview: Story = appViewportStories.desktop1440Overview;
export const Desktop1024Itinerary: Story = appViewportStories.desktop1024Itinerary;
export const Desktop1440Itinerary: Story = appViewportStories.desktop1440Itinerary;
export const Desktop1024Timeline: Story = appViewportStories.desktop1024Timeline;
export const Desktop1440Timeline: Story = appViewportStories.desktop1440Timeline;
export const Desktop1024Map: Story = appViewportStories.desktop1024Map;
export const Desktop1440Map: Story = appViewportStories.desktop1440Map;
export const Desktop1024Members: Story = appViewportStories.desktop1024Members;
export const Desktop1440Members: Story = appViewportStories.desktop1440Members;
export const Desktop1024Expenses: Story = appViewportStories.desktop1024Expenses;
export const Desktop1440Expenses: Story = appViewportStories.desktop1440Expenses;
export const Desktop1024Bookings: Story = appViewportStories.desktop1024Bookings;
export const Desktop1440Bookings: Story = appViewportStories.desktop1440Bookings;
export const Desktop1024Photos: Story = appViewportStories.desktop1024Photos;
export const Desktop1440Photos: Story = appViewportStories.desktop1440Photos;
export const Desktop1024Settings: Story = appViewportStories.desktop1024Settings;
export const Desktop1440Settings: Story = appViewportStories.desktop1440Settings;
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
export const TabletOverview: Story = appViewportStories.tabletOverview;
export const MobileOverview: Story = appViewportStories.mobileOverview;
export const TabletItinerary: Story = appViewportStories.tabletItinerary;
export const MobileItinerary: Story = appViewportStories.mobileItinerary;
export const TabletTimeline: Story = appViewportStories.tabletTimeline;
export const MobileTimeline: Story = appViewportStories.mobileTimeline;
export const TabletMap: Story = appViewportStories.tabletMap;
export const MobileMap: Story = appViewportStories.mobileMap;
export const TabletMembers: Story = appViewportStories.tabletMembers;
export const MobileMembers: Story = appViewportStories.mobileMembers;
export const TabletExpenses: Story = appViewportStories.tabletExpenses;
export const MobileExpenses: Story = appViewportStories.mobileExpenses;
export const TabletBookings: Story = appViewportStories.tabletBookings;
export const MobileBookings: Story = appViewportStories.mobileBookings;
export const TabletPhotos: Story = appViewportStories.tabletPhotos;
export const MobilePhotos: Story = appViewportStories.mobilePhotos;
export const TabletSettings: Story = appViewportStories.tabletSettings;
export const MobileSettings: Story = appViewportStories.mobileSettings;
