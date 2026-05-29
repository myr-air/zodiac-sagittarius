import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildEmptyTripFixture, tripFixture } from "@/src/demo/trip-fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { OverviewPage } from "./OverviewPage";

const meta = {
  title: "Templates/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
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

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMemberId: tripFixture.currentMembers.traveler.id,
    expenseSummary: tripFixture.expenseSummaries.traveler,
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMemberId: tripFixture.currentMembers.viewer.id,
    expenseSummary: tripFixture.expenseSummaries.viewer,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: buildEmptyTripFixture(),
    items: [],
    suggestions: [],
    tasks: [],
    expenseSummary: buildExpenseSummary([], tripFixture.currentMembers.owner.id),
  },
};
