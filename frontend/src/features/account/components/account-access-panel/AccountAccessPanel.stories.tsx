import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { AccountAccessPanel } from "./AccountAccessPanel";
import {
  accountLoginStoryArgs,
  portalDashboardStoryArgs,
} from "./account-access-panel.stories.support";

const meta = {
  title: "Pages/Account Access",
  component: AccountAccessPanel,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AccountAccessPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccountLogin: Story = {
  args: accountLoginStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "username");
  },
};

export const AccountRegister: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "account-register",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account register/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Set password and continue/i })).toBeDisabled();
  },
};

export const AccountLoginThai: Story = {
  args: AccountLogin.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
    await expect(canvas.getAllByText(/อีเมล \*/i).length).toBeGreaterThan(0);
    await expect(canvas.getByLabelText(/อีเมล/i)).toHaveAttribute("autocomplete", "username");
    await expect(canvas.getByRole("button", { name: /เข้า account/i })).toBeDisabled();
  },
};

export const TripAccess: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "trip-access",
    initialJoinCode: seedTrip.joinId,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Trip access/i })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  },
};

export const PortalDashboard: Story = {
  args: portalDashboardStoryArgs,
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/User data stats and session status/i)).toBeVisible();
    await expect(await canvas.findByRole("navigation", { name: /Portal navigation/i })).toBeVisible();
  },
};

export const NewTripBuilder: Story = {
  args: {
    ...PortalDashboard.args,
    portalSection: "new-trip",
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
    await expect(await canvas.findByRole("region", { name: /Live trip preview/i })).toHaveClass("trip-live-preview");
  },
};

export const NewTripMobile: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
    await expect(canvas.getByRole("main", { name: /Account portal/i })).toHaveClass("account-page--portal-new-trip");
  },
};

export const AccountLoginTablet: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1024: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1440: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: AccountLogin.play,
};

export const TripAccessTablet: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1024: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1440: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: TripAccess.play,
};

export const NewTripTablet: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1024: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1440: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: NewTripBuilder.play,
};
