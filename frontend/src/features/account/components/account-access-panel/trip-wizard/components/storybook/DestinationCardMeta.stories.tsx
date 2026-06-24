import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { DestinationCardMeta } from "../destination-card-meta";

const meta = {
  title: "Pages/Account Trip Wizard/Destination Card Meta",
  component: DestinationCardMeta,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof DestinationCardMeta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  args: {
    detail: "Japan",
    meta: "3 nights · Tokyo",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Japan").closest("small")).toHaveTextContent(
      "Japan · 3 nights · Tokyo",
    );
  },
};

export const Empty: Story = {
  args: {
    detail: "",
    meta: "",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeEmptyDOMElement();
  },
};
