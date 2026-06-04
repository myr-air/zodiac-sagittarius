import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { TimelineView } from "./TimelineView";

const noop = () => {};

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    selectedItemId: "item-dimdim",
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
    onSelectItem: noop,
    onToggleContextRail: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toHaveClass("timeline-panel", "grid");
    await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveClass("timeline-stop-button", "grid");
  },
};

export const Empty: Story = { args: { ...Owner.args, items: buildEmptyTripFixture().itineraryItems, selectedItemId: "" } };
