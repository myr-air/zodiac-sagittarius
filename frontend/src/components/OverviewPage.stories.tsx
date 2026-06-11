import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText("ศูนย์จัดการทริป")).toBeVisible();
    await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /เพิ่มเช็กลิสต์/i })).toBeVisible();
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

export const AddTaskDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add checklist/i }));
    await expect(canvas.getByRole("dialog", { name: /Add checklist/i })).toBeVisible();
    await expect(canvas.getByPlaceholderText(/For example, book dinner/i)).toBeVisible();
    await expect(canvas.getByText("Keep it in")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: /Add checklist item/i })[1]).toBeDisabled();
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
