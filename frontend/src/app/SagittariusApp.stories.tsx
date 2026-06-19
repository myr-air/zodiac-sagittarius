import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  portalRoutes,
  appRoutes,
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  appViewportStory,
  appViewStory,
  denseTrip,
  emptyTrip,
  expectBookingsView,
  expectExpensesView,
  expectItineraryView,
  expectMapView,
  expectMembersView,
  expectOverviewView,
  expectPhotosView,
  expectSettingsView,
  expectTimelineView,
  seedTripJoinId,
  storyTripId,
  travelerMemberId,
  viewerMemberId,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-support";

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
export const ApiJoin: Story = { args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" } };
export const JoinWithSeedCredentials: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api", initialJoinCode: seedTripJoinId },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.join() } },
  },
};
export const PublicEntry: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.home() } },
  },
};
export const AccountLogin: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.access("sign-in") } },
  },
};
export const AccountRegister: Story = {
  args: { accessMode: "account-register", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.access("register") } },
  },
};
export const AccountPortal: Story = {
  args: { accessMode: "account-portal", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.base } },
  },
};
export const AccountPortalMyTrips: Story = {
  args: { accessMode: "account-portal", portalSection: "trips", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.myTrips } },
  },
};
export const AccountPortalNewTrip: Story = {
  args: { accessMode: "account-portal", portalSection: "new-trip", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.newTrip } },
  },
};
export const AccountPortalExplorer: Story = {
  args: { accessMode: "account-portal", portalSection: "explorer", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.explorer } },
  },
};
export const AccountPortalToDos: Story = {
  args: { accessMode: "account-portal", portalSection: "todos", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.toDos } },
  },
};
export const AccountPortalVault: Story = {
  args: { accessMode: "account-portal", portalSection: "vault", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.vault } },
  },
};
export const AccountPortalSettings: Story = {
  args: { accessMode: "account-portal", portalSection: "settings", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.settings } },
  },
};
export const AccountPortalSignOut: Story = {
  args: { accessMode: "account-portal", portalSection: "sign-out", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: portalRoutes.signOut } },
  },
};
export const AccountTrips: Story = {
  args: { accessMode: "account-portal", portalSection: "trips", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.tripsBase } },
  },
};
export const AccountNewTrip: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.tripsNew } },
  },
};
export const TripAccess: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.join() } },
  },
};
export const TripAccessWithJoinCode: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api", initialJoinCode: seedTripJoinId },
  parameters: {
    nextjs: { navigation: { pathname: appRoutes.join(seedTripJoinId) } },
  },
};
export const TripOverviewAccess: Story = {
  args: { accessMode: "trip-access", initialView: "overview", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.base(storyTripId) } },
  },
};
export const TripItineraryAccess: Story = {
  args: { accessMode: "trip-access", initialView: "itinerary", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.itinerary(storyTripId) } },
  },
};
export const TripMapAccess: Story = {
  args: { accessMode: "trip-access", initialView: "map", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.map(storyTripId) } },
  },
};
export const TripTimelineAccess: Story = {
  args: { accessMode: "trip-access", initialView: "timeline", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.timeline(storyTripId) } },
  },
};
export const TripMembersAccess: Story = {
  args: { accessMode: "trip-access", initialView: "members", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: tripRoutes.members(storyTripId) } },
  },
};
export const Owner: Story = {
  args: { initialView: "overview" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
  },
};
export const OwnerThai: Story = {
  args: { initialView: "overview" },
  parameters: { locale: "th" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.ownerDocument.documentElement).toHaveAttribute("lang", "th");
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  },
};
export const Traveler: Story = {
  args: { initialView: "itinerary", initialMemberId: travelerMemberId },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".smart-table")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
    await expect(canvasElement.querySelector('button[aria-label^="Add stop"]')).toBeNull();
  },
};
export const Viewer: Story = {
  args: { initialView: "itinerary", initialMemberId: viewerMemberId },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".smart-table")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
    await expect(canvasElement.querySelector('button[aria-label^="Add stop"]')).toBeNull();
  },
};
export const Desktop1024Overview: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".workspace-grid")).toHaveClass("grid-cols-[minmax(0,1fr)]");
    await expect(canvasElement.querySelector(".side-rail")).toBeInTheDocument();
  },
};
export const Desktop1440Overview: Story = appViewportStory("overview", "desktop1440", Desktop1024Overview.play!);
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".overview-page")).toBeInTheDocument();
  },
};
export const Empty: Story = {
  args: { initialTrip: emptyTrip, initialView: "overview" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".overview-page")).toBeInTheDocument();
  },
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
