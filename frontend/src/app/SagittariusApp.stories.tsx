import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { localTripJoinId } from "@/src/trip/auth";
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

export const Cockpit: Story = {};
export const ApiJoin: Story = { args: { requireJoin: true, dataSource: "api" } };
export const DemoJoin: Story = { args: { requireJoin: true, dataSource: "demo", initialJoinCode: localTripJoinId } };
export const AccountLogin: Story = {
  args: { accessMode: "account-login", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/login" } },
  },
};
export const AccountRegister: Story = {
  args: { accessMode: "account-register", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/register" } },
  },
};
export const TripAccess: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" },
  parameters: {
    nextjs: { navigation: { pathname: "/join" } },
  },
};
export const TripAccessWithJoinCode: Story = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "demo", initialJoinCode: localTripJoinId },
  parameters: {
    nextjs: { navigation: { pathname: `/join/${localTripJoinId}` } },
  },
};
export const Owner: Story = { args: { initialView: "overview" } };
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
