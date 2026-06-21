import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mainPathOption, pathOptionPlanA } from "@/src/features/itinerary/testing";
import { DayPathControls } from "../day-path-controls";

const meta = {
  title: "Features/Itinerary/DayPathControls",
  component: DayPathControls,
  parameters: { layout: "centered" },
  args: {
    day: "2026-06-19",
    dayLabel: "Day 2",
    dayPathOptions: [mainPathOption, pathOptionPlanA],
    canEdit: true,
    showAllPaths: false,
    hasAlternativePathOptions: true,
  },
} satisfies Meta<typeof DayPathControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <DayPathControls {...args} />,
};

export const ReadOnly: Story = {
  args: {
    canEdit: false,
    showAllPaths: true,
  },
};
