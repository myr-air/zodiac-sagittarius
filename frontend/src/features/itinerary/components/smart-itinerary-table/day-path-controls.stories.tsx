import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DayPathControls } from "./day-path-controls";

const meta = {
  title: "Features/Itinerary/DayPathControls",
  component: DayPathControls,
  parameters: { layout: "centered" },
  args: {
    day: "2026-06-19",
    dayLabel: "Day 2",
    dayPathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
    ],
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
