import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTripJoinId } from "@/src/trip/auth";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { SagittariusApp } from "./SagittariusApp";

const meta = {
  title: "Sagittarius/App",
  component: SagittariusApp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SagittariusApp>;

export default meta;

type Story = StoryObj<typeof meta>;
const storyTripId = "trip-1";
const travelerMemberId = tripFixture.currentMembers.traveler.id;
const viewerMemberId = tripFixture.currentMembers.viewer.id;
const denseTrip = buildDenseTripFixture();
const emptyTrip = buildEmptyTripFixture();

function addStopButtons(canvasElement: HTMLElement) {
  return Array.from(
    canvasElement.querySelectorAll<HTMLButtonElement>(
      'button[aria-label^="Add stop"]',
    ),
  );
}

async function expectWorkspaceView(
  canvasElement: HTMLElement,
  viewClassName: string,
) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".workspace-grid")).toHaveClass("grid-cols-[minmax(0,1fr)]");
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
  await expect(canvasElement.querySelector(viewClassName)).toBeInTheDocument();
}

async function expectOverviewView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".overview-page");
}

async function expectItineraryView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".table-panel");
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("overflow-x-auto");
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass("min-w-[1080px]");
}

async function expectTimelineView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".timeline-panel");
  await expect(canvasElement.querySelector(".timeline-grid")).toBeInTheDocument();
}

async function expectMapView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".route-map-panel");
  await expect(canvasElement.querySelector(".route-map-canvas")).toBeInTheDocument();
}

async function expectMembersView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".members-page");
  await expect(canvasElement.querySelector(".member-command-bar")).toBeInTheDocument();
}

async function expectExpensesView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".expenses-page");
  await expect(canvasElement.querySelector(".expenses-content")).toBeInTheDocument();
}

async function expectBookingsView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".bookings-docs-page");
  await expect(canvasElement.querySelector(".bookings-content")).toBeInTheDocument();
}

async function expectPhotosView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".trip-photos-page");
  await expect(canvasElement.querySelector(".photos-content")).toBeInTheDocument();
}

async function expectSettingsView({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectWorkspaceView(canvasElement, ".trip-settings-page");
  await expect(canvasElement.querySelector("form[aria-label]")).toBeInTheDocument();
}

export const Cockpit: Story = {};
export const ApiJoin: Story = { args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" } };
export const JoinWithSeedCredentials: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api", initialJoinCode: seedTripJoinId },
  parameters: {
    nextjs: { navigation: { pathname: "/join" } },
  },
};
export const PublicEntry: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
  },
};
export const AccountLogin: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/access", query: { mode: "sign-in" } } },
  },
};
export const AccountRegister: Story = {
  args: { accessMode: "account-register", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/access", query: { mode: "register" } } },
  },
};
export const AccountPortal: Story = {
  args: { accessMode: "account-portal", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal" } },
  },
};
export const AccountPortalMyTrips: Story = {
  args: { accessMode: "account-portal", portalSection: "trips", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/my-trips" } },
  },
};
export const AccountPortalNewTrip: Story = {
  args: { accessMode: "account-portal", portalSection: "new-trip", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/trips/new" } },
  },
};
export const AccountPortalExplorer: Story = {
  args: { accessMode: "account-portal", portalSection: "explorer", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/explorer" } },
  },
};
export const AccountPortalToDos: Story = {
  args: { accessMode: "account-portal", portalSection: "todos", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/to-dos" } },
  },
};
export const AccountPortalVault: Story = {
  args: { accessMode: "account-portal", portalSection: "vault", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/vault" } },
  },
};
export const AccountPortalSettings: Story = {
  args: { accessMode: "account-portal", portalSection: "settings", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/settings" } },
  },
};
export const AccountPortalSignOut: Story = {
  args: { accessMode: "account-portal", portalSection: "sign-out", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/portal/sign-out" } },
  },
};
export const AccountTrips: Story = {
  args: { accessMode: "account-portal", portalSection: "trips", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/trips" } },
  },
};
export const AccountNewTrip: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/trips/new" } },
  },
};
export const TripAccess: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/join" } },
  },
};
export const TripAccessWithJoinCode: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api", initialJoinCode: seedTripJoinId },
  parameters: {
    nextjs: { navigation: { pathname: `/join/${seedTripJoinId}` } },
  },
};
export const TripOverviewAccess: Story = {
  args: { accessMode: "trip-access", initialView: "overview", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: `/trips/${storyTripId}` } },
  },
};
export const TripItineraryAccess: Story = {
  args: { accessMode: "trip-access", initialView: "itinerary", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: `/trips/${storyTripId}/itinerary` } },
  },
};
export const TripMapAccess: Story = {
  args: { accessMode: "trip-access", initialView: "map", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: `/trips/${storyTripId}/map` } },
  },
};
export const TripTimelineAccess: Story = {
  args: { accessMode: "trip-access", initialView: "timeline", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: `/trips/${storyTripId}/timeline` } },
  },
};
export const TripMembersAccess: Story = {
  args: { accessMode: "trip-access", initialView: "members", requireJoin: true, dataSource: "api", routeTripId: storyTripId },
  parameters: {
    nextjs: { navigation: { pathname: `/trips/${storyTripId}/members` } },
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
    await expect(addStopButtons(canvasElement)[0]).toBeEnabled();
  },
};
export const Viewer: Story = {
  args: { initialView: "itinerary", initialMemberId: viewerMemberId },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".smart-table")).toBeInTheDocument();
    await expect(addStopButtons(canvasElement)[0]).toBeDisabled();
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
export const Desktop1440Overview: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: Desktop1024Overview.play,
};
export const Desktop1024Itinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectItineraryView,
};
export const Desktop1440Itinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectItineraryView,
};
export const Desktop1024Timeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectTimelineView,
};
export const Desktop1440Timeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectTimelineView,
};
export const Desktop1024Map: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectMapView,
};
export const Desktop1440Map: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectMapView,
};
export const Desktop1024Members: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectMembersView,
};
export const Desktop1440Members: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectMembersView,
};
export const Desktop1024Expenses: Story = {
  args: { initialView: "expenses" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectExpensesView,
};
export const Desktop1440Expenses: Story = {
  args: { initialView: "expenses" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectExpensesView,
};
export const Desktop1024Bookings: Story = {
  args: { initialView: "bookings" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectBookingsView,
};
export const Desktop1440Bookings: Story = {
  args: { initialView: "bookings" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectBookingsView,
};
export const Desktop1024Photos: Story = {
  args: { initialView: "photos" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectPhotosView,
};
export const Desktop1440Photos: Story = {
  args: { initialView: "photos" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectPhotosView,
};
export const Desktop1024Settings: Story = {
  args: { initialView: "settings" },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: expectSettingsView,
};
export const Desktop1440Settings: Story = {
  args: { initialView: "settings" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: expectSettingsView,
};
export const Itinerary: Story = {
  args: { initialView: "itinerary" },
  play: expectItineraryView,
};
export const Timeline: Story = { args: { initialView: "timeline" } };
export const Map: Story = { args: { initialView: "map" } };
export const Members: Story = { args: { initialView: "members" } };
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
export const TabletOverview: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectOverviewView,
};
export const MobileOverview: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectOverviewView,
};
export const TabletItinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectItineraryView,
};
export const MobileItinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectItineraryView,
};
export const TabletTimeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectTimelineView,
};
export const MobileTimeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectTimelineView,
};
export const TabletMap: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectMapView,
};
export const MobileMap: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectMapView,
};
export const TabletMembers: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectMembersView,
};
export const MobileMembers: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectMembersView,
};
export const TabletExpenses: Story = {
  args: { initialView: "expenses" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectExpensesView,
};
export const MobileExpenses: Story = {
  args: { initialView: "expenses" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectExpensesView,
};
export const TabletBookings: Story = {
  args: { initialView: "bookings" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectBookingsView,
};
export const MobileBookings: Story = {
  args: { initialView: "bookings" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectBookingsView,
};
export const TabletPhotos: Story = {
  args: { initialView: "photos" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectPhotosView,
};
export const MobilePhotos: Story = {
  args: { initialView: "photos" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectPhotosView,
};
export const TabletSettings: Story = {
  args: { initialView: "settings" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: expectSettingsView,
};
export const MobileSettings: Story = {
  args: { initialView: "settings" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: expectSettingsView,
};
