import type { FormEvent } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import type { OverviewTaskListLabels } from "./OverviewTaskList";

export type TaskScopeFilter = "mine" | "trip" | "all";
export type TaskStatusFilter = "all" | "open" | "done";

interface OverviewChecklistPanelBaseProps {
  trip: Trip;
  locale: Locale;
  items: ItineraryItem[];
  groupSpendLabel: string;
  nextStop: ItineraryItem | undefined;
  nextDayItems: ItineraryItem[];
  focusTodayHeading: string;
  isCompleted: boolean;
  openExpenses: () => void;
  taskListLabels: OverviewTaskListLabels;
  onToggleTask: (task: TripTask) => void;
}

export interface TravelerOverviewPanelsProps extends OverviewChecklistPanelBaseProps {
  foodStops: ItineraryItem[];
  tripHighlights: ItineraryItem[];
  focusSectionDetailFallback: string;
  taskStatusFilter: TaskStatusFilter;
  setTaskStatusFilter: (filter: TaskStatusFilter) => void;
  visibleTasks: TripTask[];
  newTaskTitle: string;
  onTaskTitleChange: (title: string) => void;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  expenseNetLabel: string;
  expenseSettlementSuggestionsLabel: string;
}

export interface ViewerOverviewPanelsProps {
  trip: Trip;
  locale: Locale;
  viewerHighlights: ItineraryItem[];
  expenseGroupSpend: number;
  nextStop: ItineraryItem | undefined;
  openExpenses: () => void;
}

export interface ManagerOverviewPanelsProps extends OverviewChecklistPanelBaseProps {
  taskScopeFilter: TaskScopeFilter;
  setTaskScopeFilter: (filter: TaskScopeFilter) => void;
  taskStatusFilter: TaskStatusFilter;
  setTaskStatusFilter: (filter: TaskStatusFilter) => void;
  myOpenTasks: number;
  sharedOpenTasks: number;
  pendingSuggestions: number;
  visibleTasks: TripTask[];
  focusSectionDetailFallback: string;
  openTaskDialog: () => void;
}
