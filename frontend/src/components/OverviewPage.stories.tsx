import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { weatherBriefings } from "./WeatherBriefing.fixtures";
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
    dailyBriefings: weatherBriefings,
    onCreateTask: () => {},
    onSaveDailyBriefingOverrides: () => {},
    onToggleTaskStatus: () => {},
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
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

export const Dense: Story = {
  args: {
    ...Owner.args,
    trip: buildDenseTripFixture(),
    items: buildDenseTripFixture().itineraryItems,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: buildEmptyTripFixture(),
    items: [],
    suggestions: [],
    tasks: [],
    dailyBriefings: [],
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
