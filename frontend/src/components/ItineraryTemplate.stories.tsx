import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};

const meta = {
  title: "Templates/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    canRedo: false,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: "item-dimdim",
    tripName: tripFixture.trip.name,
    onAddStop: noop,
    onSelectItem: noop,
    onMoveItem: noop,
    onRedo: noop,
    onToggleContextRail: noop,
    onUndo: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[960px]");
  },
};

export const Viewer: Story = { args: { ...Owner.args, role: "viewer" } };
export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
