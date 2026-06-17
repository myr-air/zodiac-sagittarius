import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { ManagerOverviewPanels, TravelerOverviewPanels, ViewerOverviewPanels } from "@/src/features/itinerary/components/overview/OverviewRolePanels";
import type { Locale } from "@/src/i18n/types";

const overviewTaskListLabels = {
  assignee: {
    private: "Private",
    shared: "Shared",
    tripMember: "Trip member",
    unassigned: "Unassigned",
  },
  kind: {
    booking: "Booking",
    prep: "Prep",
    planStop: "Plan stop",
  },
};

const nextStop = tripFixture.planItems[0]!;
const nextDayItems = tripFixture.planItems.slice(1, 4);

const basePanelProps = {
  trip: tripFixture.trip,
  locale: "en" as const satisfies Locale,
  items: tripFixture.planItems,
  groupSpendLabel: "HK$2,300",
  nextStop,
  nextDayItems,
  focusTodayHeading: "Today and next focus",
  isCompleted: false,
  openExpenses: () => {},
  taskListLabels: overviewTaskListLabels,
};

const meta = {
  title: "Components/Overview/Role Panels",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Traveler: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <TravelerOverviewPanels
        {...basePanelProps}
        onToggleTask={() => {}}
        foodStops={tripFixture.planItems.slice(0, 2)}
        tripHighlights={tripFixture.planItems.slice(2, 5)}
        focusSectionDetailFallback="Traveler focus detail"
        taskStatusFilter="all"
        setTaskStatusFilter={() => {}}
        visibleTasks={tripFixture.tasks}
        newTaskTitle="Pack an adapter"
        onTaskTitleChange={() => {}}
        onSubmitTask={(event) => event.preventDefault()}
        expenseNetLabel={tripFixture.expenseSummaries.traveler.currentUserNetLabel}
        expenseSettlementSuggestionsLabel="Pending settlements: 2"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /traveler highlights/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /my travel checklist/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  },
};

export const Viewer: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ViewerOverviewPanels
        {...basePanelProps}
        viewerHighlights={tripFixture.planItems.slice(0, 3)}
        expenseGroupSpend={tripFixture.expenseSummaries.viewer.groupSpend}
        nextStop={nextStop}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /read-only trip snapshot/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /next important stop/i })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /add checklist item/i })).toBeNull();
  },
};

export const Manager: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ManagerOverviewPanels
        {...basePanelProps}
        onToggleTask={() => {}}
        taskScopeFilter="mine"
        setTaskScopeFilter={() => {}}
        taskStatusFilter="open"
        setTaskStatusFilter={() => {}}
        myOpenTasks={3}
        sharedOpenTasks={5}
        pendingSuggestions={2}
        visibleTasks={tripFixture.tasks}
        focusSectionDetailFallback="Manager focus detail"
        openTaskDialog={() => {}}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /trip readiness/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /trip checklist/i })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: /checklist scope/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /add checklist item/i })).toBeInTheDocument();
  },
};
