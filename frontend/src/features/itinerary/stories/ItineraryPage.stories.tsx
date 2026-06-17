import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import { pathIdStoryPlanA, pathIdStoryPlanB } from "@/src/features/itinerary/testing";
import {
  branchGraphItemsBase,
  branchGraphPathOptions,
  planAExampleItemsBase,
  planAPathOptions,
  planABAlternativeItemsBase,
  planABPathOptions,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  stressPathOptions,
  windowOnlyDurationItemBase,
  withStoryPrefix,
  buildOwnerStoryArgs,
  denseTripFixture,
  emptyTripFixture,
} from "./itinerary-story-fixtures";

const noop = () => {};
const onStoryChangeDayPath = fn();
const onStoryMoveItemToPath = fn();
const onStoryToggleShowAllPaths = fn();
const onStoryUpdateItemInline = fn();
const onStoryInlineQuickEdit = fn();
const pageBranchGraphItems: ItineraryItem[] = withStoryPrefix(branchGraphItemsBase, "page");
const pagePlanAExampleItems: ItineraryItem[] = withStoryPrefix(planAExampleItemsBase, "page");
const pageWindowOnlyDurationItems: ItineraryItem[] = withStoryPrefix(windowOnlyDurationItemBase, "page");
const pagePlanABAlternativeItems: ItineraryItem[] = withStoryPrefix(planABAlternativeItemsBase, "page");
const pageRequestedPlanExampleItems: ItineraryItem[] = withStoryPrefix(requestedPlanExampleItemsBase, "page");
const pageStressPathItems: ItineraryItem[] = withStoryPrefix(stressPathItemsBase, "page");

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectItineraryResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("table-scroll", "overflow-x-auto", "max-w-full");
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass("smart-table", "min-w-[520px]");
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
}

export const Owner: Story = {
  args: buildOwnerStoryArgs({
    onMoveItemToPath: onStoryMoveItemToPath,
    onChangeDayPath: onStoryChangeDayPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  }),
  play: async ({ canvas, canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
    await expect(canvas.queryByRole("button", { name: /^Import$/i })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /^Export$/i })).toBeNull();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
    await expect(canvas.queryAllByRole("button", { name: /Edit Dim Dim Sum/i })).toHaveLength(0);
  },
};

export const InlineQuickEdit: Story = {
  args: {
    ...Owner.args,
    onUpdateItemInline: onStoryInlineQuickEdit,
  },
  play: async ({ canvas, canvasElement }) => {
    onStoryInlineQuickEdit.mockClear();
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvas.getByRole("textbox", { name: /Edit activity Dim Dim Sum/i })).toHaveValue(
      "Dim Dim Sum ที่ Tim Ho Wan",
    );
    await expect(onStoryInlineQuickEdit).not.toHaveBeenCalled();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[520px]");
  },
};

export const TimeWindowDuration: Story = {
  args: {
    ...Owner.args,
    items: pageWindowOnlyDurationItems,
    selectedItemId: "page-window-only-duration",
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Editing requires organizer access/i)).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /^Import$/i })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /^Export$/i })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Add stop or activity/i })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Edit Dim Dim Sum/i })).toBeNull();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    role: "traveler",
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Editing requires organizer access/i)).toBeNull();
    await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
    await expect(canvas.queryAllByRole("button", { name: /Edit Dim Dim Sum/i })).toHaveLength(0);
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: denseTripFixture.itineraryItems,
    selectedItemId: "",
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: emptyTripFixture.itineraryItems,
    selectedItemId: "",
  },
};

export const OverlapConflictWarning: Story = {
  args: {
    ...Owner.args,
    selectedItemId: "overlap-dim-sum",
    items: [
      {
        ...tripFixture.planItems[0],
        id: "overlap-peak-tram",
        day: tripFixture.trip.startDate,
        startTime: "09:00",
        durationMinutes: 120,
        sortOrder: 10,
        pathId: "main",
        pathName: "Main",
        pathRole: "main",
      },
      {
        ...tripFixture.planItems[1],
        id: "overlap-dim-sum",
        day: tripFixture.trip.startDate,
        startTime: "09:30",
        durationMinutes: 90,
        sortOrder: 20,
        pathId: "main",
        pathName: "Main",
        pathRole: "main",
      },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Auto fix overlaps/i })).toBeNull();
  },
};

export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: pagePlanAExampleItems,
    graphItems: pagePlanAExampleItems,
    selectedItemId: "page-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Itinerary table/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A museum stop on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan A cafe backup on Plan A/i })).toBeInTheDocument();
  },
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: planABPathOptions,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A gallery route on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan B harbour route on Plan B/i })).toBeInTheDocument();
    await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
  },
};

export const PathAndDurationInteractions: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: false,
    pathOptions: planABPathOptions,
    onChangeDayPath: onStoryChangeDayPath,
    onMoveItemToPath: onStoryMoveItemToPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  },
  play: async ({ canvas, canvasElement }) => {
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const dayToggle = canvas.getByRole("button", { name: /Collapse Day 2/i });
    await userEvent.click(dayToggle);
    await expect(dayToggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(dayToggle);
    await expect(dayToggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("button", { name: /Path for Day 2/i }));
    const dayPathMenu = documentCanvas.getByRole("listbox", { name: /Path for Day 2/i });
    await userEvent.click(within(dayPathMenu).getByRole("option", { name: "Plan B" }));
    await expect(onStoryChangeDayPath).toHaveBeenCalledWith("2026-06-19", pathIdStoryPlanB);

    await userEvent.click(canvas.getByRole("button", { name: "Trip Plan controls" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: /Show all paths/i }));
    await expect(onStoryToggleShowAllPaths).toHaveBeenCalledWith(true);

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: /Move Harbour breakfast to path/i }), pathIdStoryPlanA);
    await expect(onStoryMoveItemToPath).toHaveBeenCalledWith("page-plan-ab-main-breakfast", pathIdStoryPlanA);

    await expect(canvas.queryByRole("button", { name: /Edit duration Harbour breakfast/i })).not.toBeInTheDocument();
  },
};

export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: pageBranchGraphItems,
    graphItems: pageBranchGraphItems,
    selectedItemId: "page-graph-main",
    showAllPaths: true,
    pathOptions: branchGraphPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Dim Sum morning on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Rain museum on Rain plan/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Late coffee on Plan A/i })).toBeInTheDocument();
  },
};

export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: pageRequestedPlanExampleItems,
    graphItems: pageRequestedPlanExampleItems,
    selectedItemId: "page-requested-main-0800",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Main 08:00 block on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A 09:00 branch on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan A 12:30 branch on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Main 16:00 block on Main/i })).toBeInTheDocument();
  },
};

export const StressPaths: Story = {
  args: {
    ...Owner.args,
    items: pageStressPathItems,
    graphItems: pageStressPathItems,
    selectedItemId: "page-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Taxi direct route on Plan C/i })).toBeInTheDocument();
  },
};

export const TableOverflow: Story = {
  args: {
    ...Owner.args,
    items: pageStressPathItems.map((item, index) => ({
      ...item,
      id: `page-overflow-${item.id}`,
      activity: `${item.activity} with long operational copy for page-level overflow validation ${index + 1}`,
      place: `${item.place} - gate notes, booking reference, and meet-up details`,
      transport: "Airport Express transfer with luggage coordination",
    })),
    graphItems: pageStressPathItems,
    selectedItemId: "page-overflow-page-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvasElement.querySelector(".activity-path-graph")).toBeInTheDocument();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvasElement.querySelector(".mobile-itinerary-inspector")).toBeNull();
  },
};

export const MobileInspectorQuickEdit: Story = {
  args: {
    ...Owner.args,
    onUpdateItemInline: onStoryInlineQuickEdit,
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    onStoryInlineQuickEdit.mockClear();
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvasElement.querySelector(".mobile-itinerary-inspector")).toBeNull();
    await expect(onStoryInlineQuickEdit).not.toHaveBeenCalled();
  },
};

export const MobileViewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvasElement.querySelector(".mobile-itinerary-inspector")).toBeNull();
  },
};
