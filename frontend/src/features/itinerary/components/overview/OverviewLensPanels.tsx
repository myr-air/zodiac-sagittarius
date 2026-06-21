import type { FormEvent } from "react";
import {
  managerNextStopDetail,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain/overview";
import type { Locale } from "@/src/i18n/types";
import type { ExpenseSummary, ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { ManagerOverviewPanels } from "./ManagerOverviewPanels";
import type { OverviewTaskListLabels } from "./OverviewTaskList";
import { TravelerOverviewPanels } from "./TravelerOverviewPanels";
import { ViewerOverviewPanels } from "./ViewerOverviewPanels";
import type { TaskScopeFilter, TaskStatusFilter } from "./overview-role-panels.types";

interface OverviewLensPanelsProps {
  expenseSummary: ExpenseSummary;
  focusDetails: {
    managerFallback: string;
    travelerFallback: string;
  };
  focusTodayHeading: string;
  foodStops: ItineraryItem[];
  groupSpendLabel: string;
  isCompleted: boolean;
  isManagerLens: boolean;
  isTravelerLens: boolean;
  isViewerLens: boolean;
  items: ItineraryItem[];
  locale: Locale;
  money: {
    settlementSuggestions: string;
  };
  myOpenTasks: number;
  newTaskTitle: string;
  nextDayItems: ItineraryItem[];
  nextStop: ItineraryItem | undefined;
  onOpenExpenses: () => void;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  onTaskTitleChange: (title: string) => void;
  onToggleTask: (task: TripTask) => void;
  openTaskDialog: () => void;
  pendingSuggestions: number;
  setTaskScopeFilter: (filter: TaskScopeFilter) => void;
  setTaskStatusFilter: (filter: TaskStatusFilter) => void;
  sharedOpenTasks: number;
  taskListLabels: OverviewTaskListLabels;
  taskScopeFilter: TaskScopeFilter;
  taskStatusFilter: TaskStatusFilter;
  trip: Trip;
  tripHighlights: ItineraryItem[];
  viewerHighlights: ItineraryItem[];
  visibleTasks: TripTask[];
}

export function OverviewLensPanels({
  expenseSummary,
  focusDetails,
  focusTodayHeading,
  foodStops,
  groupSpendLabel,
  isCompleted,
  isManagerLens,
  isTravelerLens,
  isViewerLens,
  items,
  locale,
  money,
  myOpenTasks,
  newTaskTitle,
  nextDayItems,
  nextStop,
  onOpenExpenses,
  onSubmitTask,
  onTaskTitleChange,
  onToggleTask,
  openTaskDialog,
  pendingSuggestions,
  setTaskScopeFilter,
  setTaskStatusFilter,
  sharedOpenTasks,
  taskListLabels,
  taskScopeFilter,
  taskStatusFilter,
  trip,
  tripHighlights,
  viewerHighlights,
  visibleTasks,
}: OverviewLensPanelsProps) {
  return (
    <>
      {isTravelerLens ? (
        <TravelerOverviewPanels
          trip={trip}
          locale={locale}
          items={items}
          groupSpendLabel={groupSpendLabel}
          nextStop={nextStop}
          nextDayItems={nextDayItems}
          focusTodayHeading={focusTodayHeading}
          isCompleted={isCompleted}
          openExpenses={onOpenExpenses}
          taskListLabels={taskListLabels}
          onToggleTask={onToggleTask}
          foodStops={foodStops}
          tripHighlights={tripHighlights}
          focusSectionDetailFallback={nextStop ? travelerNextStopDetail(nextStop, focusDetails.travelerFallback) : focusDetails.travelerFallback}
          taskStatusFilter={taskStatusFilter}
          setTaskStatusFilter={setTaskStatusFilter}
          visibleTasks={visibleTasks}
          newTaskTitle={newTaskTitle}
          onTaskTitleChange={onTaskTitleChange}
          onSubmitTask={onSubmitTask}
          expenseNetLabel={expenseSummary.currentUserNetLabel}
          expenseSettlementSuggestionsLabel={money.settlementSuggestions}
        />
      ) : null}

      {isViewerLens ? (
        <ViewerOverviewPanels
          trip={trip}
          locale={locale}
          nextStop={nextStop}
          openExpenses={onOpenExpenses}
          viewerHighlights={viewerHighlights}
          expenseGroupSpend={expenseSummary.groupSpend}
        />
      ) : null}

      {isManagerLens ? (
        <ManagerOverviewPanels
          trip={trip}
          locale={locale}
          items={items}
          groupSpendLabel={groupSpendLabel}
          nextStop={nextStop}
          nextDayItems={nextDayItems}
          focusTodayHeading={focusTodayHeading}
          isCompleted={isCompleted}
          openExpenses={onOpenExpenses}
          taskListLabels={taskListLabels}
          onToggleTask={onToggleTask}
          taskScopeFilter={taskScopeFilter}
          setTaskScopeFilter={setTaskScopeFilter}
          taskStatusFilter={taskStatusFilter}
          setTaskStatusFilter={setTaskStatusFilter}
          myOpenTasks={myOpenTasks}
          sharedOpenTasks={sharedOpenTasks}
          pendingSuggestions={pendingSuggestions}
          visibleTasks={visibleTasks}
          focusSectionDetailFallback={nextStop ? managerNextStopDetail(nextStop, focusDetails.managerFallback) : focusDetails.managerFallback}
          openTaskDialog={openTaskDialog}
        />
      ) : null}
    </>
  );
}
