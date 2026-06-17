import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DayTitleEditor } from "./day-title-editor";

const meta = {
  title: "Features/Itinerary/DayTitleEditor",
  component: DayTitleEditor,
  parameters: { layout: "centered" },
  args: {
    canEdit: true,
    date: "2026-06-19",
    dayLabel: "Day 2",
    defaultTitle: "Day 2",
    title: "Planned Day Title",
    version: 1,
  },
} satisfies Meta<typeof DayTitleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <DayTitleEditor {...args} />,
};

export const ReadOnly: Story = {
  args: { canEdit: false },
};
