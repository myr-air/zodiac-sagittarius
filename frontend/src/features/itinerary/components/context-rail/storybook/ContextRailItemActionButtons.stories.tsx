import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { noop } from "@/src/testing/storybook-actions";
import { ContextRailItemActionButtons } from "../ContextRailItemActionButtons";

const meta = {
  title: "Features/Itinerary/ContextRailItemActionButtons",
  component: ContextRailItemActionButtons,
  parameters: { layout: "centered" },
  args: {
    actions: [
      {
        ariaLabel: "Edit expense Dim sum",
        icon: "edit",
        onClick: noop,
      },
      {
        ariaLabel: "Delete expense Dim sum",
        icon: "trash",
        onClick: noop,
      },
    ],
  },
} satisfies Meta<typeof ContextRailItemActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    actions: [
      {
        ariaLabel: "Edit expense Dim sum",
        disabled: true,
        icon: "edit",
        onClick: noop,
      },
      {
        ariaLabel: "Delete expense Dim sum",
        disabled: true,
        icon: "trash",
        onClick: noop,
      },
    ],
  },
};
