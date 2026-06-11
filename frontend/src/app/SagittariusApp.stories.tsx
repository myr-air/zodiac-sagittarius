import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTripJoinId } from "@/src/trip/auth";
import { tripFixture } from "@/src/trip/trip-fixtures";
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

function addStopButtons(canvasElement: HTMLElement) {
  return Array.from(
    canvasElement.querySelectorAll<HTMLButtonElement>(
      'button[aria-label^="Add stop"]',
    ),
  );
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
export const Desktop1024: Story = {
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
export const Desktop1440: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: Desktop1024.play,
};
export const Itinerary: Story = {
  args: { initialView: "itinerary" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".table-panel")).toBeInTheDocument();
    await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("overflow-x-auto");
    await expect(canvasElement.querySelector(".smart-table")).toHaveClass("min-w-[1080px]");
  },
};
export const Timeline: Story = { args: { initialView: "timeline" } };
export const Map: Story = { args: { initialView: "map" } };
export const Members: Story = { args: { initialView: "members" } };
export const Mobile: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
};
export const TabletItinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: Itinerary.play,
};
export const MobileItinerary: Story = {
  args: { initialView: "itinerary" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: Itinerary.play,
};
export const TabletTimeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
};
export const MobileTimeline: Story = {
  args: { initialView: "timeline" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
};
export const TabletMap: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
};
export const MobileMap: Story = {
  args: { initialView: "map" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
};
export const TabletMembers: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
};
export const MobileMembers: Story = {
  args: { initialView: "members" },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
};
