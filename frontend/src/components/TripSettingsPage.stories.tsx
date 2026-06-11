import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripSettingsPage } from "./TripSettingsPage";

const noop = async () => {};

const meta = {
  title: "Pages/Trip Settings",
  component: TripSettingsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripSettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    canEdit: true,
    currentMember: tripFixture.currentMembers.owner,
    trip: seedTrip,
    onSave: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip settings/i })).toHaveClass("trip-settings-page");
    await expect(canvas.getByRole("form", { name: /Trip details/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeEnabled();
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    canEdit: false,
    currentMember: tripFixture.currentMembers.viewer,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Only owners and organizers can edit trip settings/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeDisabled();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    canEdit: false,
    currentMember: tripFixture.currentMembers.traveler,
  },
  play: Viewer.play,
};

export const Thai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ตั้งค่าทริป/i })).toBeVisible();
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
