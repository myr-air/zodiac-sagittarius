import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { PeoplePanel } from "./PeoplePanel";
import {
  emptyPeoplePanelStoryArgs,
  managerPeoplePanelStoryArgs,
  readOnlyPeoplePanelStoryArgs,
} from "./PeoplePanel.stories.support";

const meta = {
  title: "Design System/People Panel",
  component: PeoplePanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PeoplePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manager: Story = {
  args: managerPeoplePanelStoryArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: /People and presence/i })).toHaveClass("people-module", "grid");
    await expect(canvas.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex");
  },
};

export const ReadOnly: Story = {
  args: readOnlyPeoplePanelStoryArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex");
  },
};

export const Empty: Story = {
  parameters: { locale: "th" },
  args: emptyPeoplePanelStoryArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass("grid");
    await userEvent.click(canvas.getByRole("button", { name: /ล้างตัวกรอง/i }));
  },
};
