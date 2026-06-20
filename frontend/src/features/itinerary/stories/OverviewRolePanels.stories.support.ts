import type { FormEvent } from "react";
import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type {
  ManagerOverviewPanelsProps,
  TravelerOverviewPanelsProps,
  ViewerOverviewPanelsProps,
} from "@/src/features/itinerary/components/overview/overview-role-panels.types";
import type { OverviewTaskListLabels } from "@/src/features/itinerary/components/overview/OverviewTaskList";

const overviewTaskListLabels: OverviewTaskListLabels = {
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
  locale: "en",
  items: tripFixture.planItems,
  groupSpendLabel: "HK$2,300",
  nextStop,
  nextDayItems,
  focusTodayHeading: "Today and next focus",
  isCompleted: false,
  openExpenses: noop,
  taskListLabels: overviewTaskListLabels,
  onToggleTask: noop,
} satisfies Pick<
  TravelerOverviewPanelsProps,
  | "trip"
  | "locale"
  | "items"
  | "groupSpendLabel"
  | "nextStop"
  | "nextDayItems"
  | "focusTodayHeading"
  | "isCompleted"
  | "openExpenses"
  | "taskListLabels"
  | "onToggleTask"
>;

export const travelerOverviewPanelStoryProps = {
  ...basePanelProps,
  foodStops: tripFixture.planItems.slice(0, 2),
  tripHighlights: tripFixture.planItems.slice(2, 5),
  focusSectionDetailFallback: "Traveler focus detail",
  taskStatusFilter: "all",
  setTaskStatusFilter: noop,
  visibleTasks: tripFixture.tasks,
  newTaskTitle: "Pack an adapter",
  onTaskTitleChange: noop,
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
  expenseNetLabel: tripFixture.expenseSummaries.traveler.currentUserNetLabel,
  expenseSettlementSuggestionsLabel: "Pending settlements: 2",
} satisfies TravelerOverviewPanelsProps;

export const viewerOverviewPanelStoryProps = {
  trip: tripFixture.trip,
  locale: "en",
  viewerHighlights: tripFixture.planItems.slice(0, 3),
  expenseGroupSpend: tripFixture.expenseSummaries.viewer.groupSpend,
  nextStop,
  openExpenses: noop,
} satisfies ViewerOverviewPanelsProps;

export const managerOverviewPanelStoryProps = {
  ...basePanelProps,
  taskScopeFilter: "mine",
  setTaskScopeFilter: noop,
  taskStatusFilter: "open",
  setTaskStatusFilter: noop,
  myOpenTasks: 3,
  sharedOpenTasks: 5,
  pendingSuggestions: 2,
  visibleTasks: tripFixture.tasks,
  focusSectionDetailFallback: "Manager focus detail",
  openTaskDialog: noop,
} satisfies ManagerOverviewPanelsProps;
