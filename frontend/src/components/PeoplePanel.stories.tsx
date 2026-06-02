import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { PeoplePanel } from "./PeoplePanel";

const managerArgs = {
  members: seedTrip.members.filter((member) => member.id !== "member-viewer"),
  currentMemberId: "member-aom",
  canManagePeople: true,
  onChangeMemberAccessStatus: () => {},
  onChangeCurrentMemberPassword: () => {},
  onChangeMemberRole: () => {},
  onResetMemberClaim: () => {},
};

const meta = {
  title: "Design System/People Panel",
  component: PeoplePanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PeoplePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manager: Story = {
  args: managerArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: /People and presence/i })).toHaveClass("people-module", "grid");
    await expect(canvas.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex");
  },
};

export const ReadOnly: Story = {
  args: {
    ...managerArgs,
    currentMemberId: "member-nam",
    canManagePeople: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex");
  },
};

export const Empty: Story = {
  args: {
    members: [],
    currentMemberId: "member-aom",
    emptyMessage: "ไม่มีสมาชิกในตัวกรองนี้",
    onResetFilters: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass("grid");
    await userEvent.click(canvas.getByRole("button", { name: /ล้างตัวกรอง/i }));
  },
};
