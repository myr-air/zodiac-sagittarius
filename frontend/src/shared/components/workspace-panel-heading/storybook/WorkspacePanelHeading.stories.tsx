import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  WorkspacePanelHeading,
  workspacePanelHeadingVariantValues,
} from "../WorkspacePanelHeading";

const meta = {
  title: "Shared/Workspace/Panel Heading",
  component: WorkspacePanelHeading,
  parameters: { layout: "centered" },
  args: {
    icon: "wallet",
    title: "Settle up",
    variant: "compact",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: workspacePanelHeadingVariantValues,
    },
  },
  render: (args) => (
    <div className="w-[320px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <WorkspacePanelHeading {...args} />
    </div>
  ),
} satisfies Meta<typeof WorkspacePanelHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Compact: Story = {};

export const Overview: Story = {
  args: {
    icon: "route",
    title: "Today focus",
    variant: "overview",
  },
};
