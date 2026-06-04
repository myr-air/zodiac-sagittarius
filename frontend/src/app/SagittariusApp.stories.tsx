import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { seedTripJoinId } from "@/src/trip/auth";
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
export const Owner: Story = { args: { initialView: "overview" } };
export const OwnerThai: Story = { args: { initialView: "overview" }, parameters: { locale: "th" } };
export const Itinerary: Story = { args: { initialView: "itinerary" } };
export const Timeline: Story = { args: { initialView: "timeline" } };
export const Map: Story = { args: { initialView: "map" } };
export const Members: Story = { args: { initialView: "members" } };
export const Mobile: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
