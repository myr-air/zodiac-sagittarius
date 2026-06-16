import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { OverviewPage } from "@/src/features/itinerary/components";

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

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /ไฮไลต์ทริป/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /Trip overview/i })).toHaveClass("grid");
    await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toHaveClass("overview-hero", "grid");
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3");
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

export const Dense: Story = {
  args: {
    ...Owner.args,
    trip: buildDenseTripFixture(),
    items: buildDenseTripFixture().itineraryItems,
  },
};
