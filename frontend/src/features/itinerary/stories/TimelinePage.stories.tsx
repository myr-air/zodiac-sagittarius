import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { TimelineView } from "@/src/features/itinerary/components";
import type { ItineraryItem } from "@/src/trip/types";
import { planABAlternativeItemsBase, withStoryPrefix } from "./itinerary-story-fixtures";

const meta = {
  title: "Pages/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectTimelineStructure(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".timeline-panel")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".timeline-grid")).toHaveClass("timeline-grid", "grid", "grid-cols-3");
}

const timelinePlanABAlternativeItems = withStoryPrefix(planABAlternativeItemsBase, "timeline");
const timelineAdvisoryItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "timeline-advisory-main",
    activity: "Peak tram timed entry",
    advisories: [{ code: "ticket-window", label: "Book timed ticket", severity: "warning" }],
  },
  {
    ...tripFixture.planItems[1],
    id: "timeline-advisory-followup",
    activity: "Harbour transfer buffer",
    advisories: [],
  },
];

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
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toHaveClass("timeline-panel");
    await expect(canvas.getByText("ไทม์ไลน์")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Traveler: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
    await expect(canvas.getByRole("button", { name: /Select timeline stop Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Viewer: Story = {
  args: Owner.args,
  play: Traveler.play,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: buildDenseTripFixture().itineraryItems,
    selectedItemId: "",
  },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
    await expect(canvasElement.querySelectorAll(".timeline-day").length).toBeGreaterThan(3);
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: buildEmptyTripFixture().itineraryItems,
    selectedItemId: "",
  },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
    await expect(canvasElement.querySelectorAll(".timeline-stop").length).toBe(0);
  },
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: timelinePlanABAlternativeItems,
    selectedItemId: "timeline-plan-ab-main-breakfast",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
    await expect(canvas.getByRole("button", { name: /Select timeline stop Harbour breakfast/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: /Select timeline stop Plan A gallery route/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Select timeline stop Plan B harbour route/i })).toBeInTheDocument();
  },
};

export const AdvisoryWarning: Story = {
  args: {
    ...Owner.args,
    items: timelineAdvisoryItems,
    selectedItemId: "timeline-advisory-main",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
    await expect(canvas.getByRole("button", { name: /Select timeline stop Peak tram timed entry/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("Book timed ticket")).toHaveClass("timeline-warning");
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
    await expect(canvasElement.querySelector(".timeline-grid")).toHaveClass("max-[1199px]:grid-cols-1");
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectTimelineStructure(canvasElement);
    await expect(canvasElement.querySelector(".timeline-grid")).toHaveClass("max-[1199px]:grid-cols-1", "max-[767px]:overflow-y-auto");
    await expect(canvasElement.querySelector(".timeline-stop-button")).toHaveClass("max-[767px]:grid-cols-[62px_32px_minmax(0,1fr)]");
  },
};
