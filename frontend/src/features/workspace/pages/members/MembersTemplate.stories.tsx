import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripMembersPage } from "./TripMembersPage";
import {
  denseMembersTrip,
  membersOwnerStoryArgs,
  singleMemberTrip,
} from "./MembersPage.stories.support";

const meta = {
  title: "Templates/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: membersOwnerStoryArgs,
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: /^Status$/i }), "pending");
    await expect(canvas.getByText("Explorer Friend")).toBeVisible();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /สมาชิกทริป/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page", "grid");
    await expect(canvas.getByRole("region", { name: /สรุปสมาชิก/i })).toHaveClass("member-stat-grid", "grid");
    await expect(canvas.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass("member-command-bar", "grid");
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canManagePeople: false,
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    canManagePeople: false,
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    trip: denseMembersTrip,
    currentMember: denseMembersTrip.members.find((member) => member.role === "owner") ?? tripFixture.currentMembers.owner,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: singleMemberTrip,
    currentMember: tripFixture.currentMembers.owner,
  },
};
