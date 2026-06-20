import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TripMembersPage } from "./TripMembersPage";
import {
  membersDenseStoryArgs,
  membersEmptyStoryArgs,
  expectMembersResponsiveContract,
  membersOwnerStoryArgs,
  membersTravelerStoryArgs,
  membersViewerStoryArgs,
} from "./MembersPage.stories.support";

const meta = {
  title: "Pages/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: membersOwnerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip members/i })).toHaveClass("members-page");
    await expect(canvas.getByRole("button", { name: /Copy invite/i })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /Open add-member form/i })).toBeEnabled();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page");
    await expect(canvas.getByText("สมาชิกในทริป")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeVisible();
  },
};

export const Traveler: Story = {
  args: membersTravelerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /copy invite|คัดลอกลิงก์เชิญ/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /add member|เปิดฟอร์มเพิ่มสมาชิก/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent(/read only|อ่านอย่างเดียว/i);
  },
};

export const Viewer: Story = {
  args: membersViewerStoryArgs,
  play: Traveler.play,
};

export const Dense: Story = {
  args: membersDenseStoryArgs,
};

export const Empty: Story = {
  args: membersEmptyStoryArgs,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectMembersResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectMembersResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectMembersResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await expectMembersResponsiveContract(canvasElement);
    await expect(canvas.getByRole("button", { name: /Copy invite|คัดลอกลิงก์เชิญ/i })).toBeVisible();
  },
};
