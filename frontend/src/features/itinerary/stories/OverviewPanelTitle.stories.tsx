import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OverviewPanelTitle } from "@/src/features/itinerary/components/overview/OverviewPanelTitle";

const meta = {
  title: "Components/Overview/Panel Title",
  component: OverviewPanelTitle,
  parameters: { layout: "centered" },
  args: {
    icon: "route",
    title: "Today focus",
  },
  render: (args) => (
    <div className="w-[320px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <OverviewPanelTitle {...args} />
    </div>
  ),
} satisfies Meta<typeof OverviewPanelTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Route: Story = {};

export const Checklist: Story = {
  args: {
    icon: "check",
    title: "Trip checklist",
  },
};
