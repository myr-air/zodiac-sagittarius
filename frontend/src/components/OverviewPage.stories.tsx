import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { OverviewPage } from "./OverviewPage";

const meta = {
  title: "Pages/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMemberId: tripFixture.currentMembers.owner.id,
    expenseSummary: tripFixture.expenseSummaries.owner,
    items: tripFixture.planItems,
    suggestions: tripFixture.suggestions,
    tasks: tripFixture.tasks,
    onCreateTask: () => {},
    onToggleTaskStatus: () => {},
  },
};
