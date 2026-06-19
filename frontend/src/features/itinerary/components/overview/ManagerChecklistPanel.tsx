import { Icon } from "@/src/ui/icons";
import { SegmentedControl } from "@/src/ui";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { OverviewTaskList, type OverviewTaskListLabels } from "./OverviewTaskList";
import {
  overviewHealthGridClassName,
  overviewPanelClassName,
  overviewPanelHealthClassName,
  overviewPanelTitleClassName,
  overviewTaskAddButtonClassName,
  overviewTaskFilterActiveClassName,
  overviewTaskFiltersClassName,
  overviewTaskPanelClassName,
  overviewTaskToolbarClassName,
} from "./overview-page.styles";
import type { TaskScopeFilter, TaskStatusFilter } from "./overview-role-panels.types";

interface ManagerReadinessPanelProps {
  ariaLabel: string;
  myChecklistLabel: string;
  myOpenTasks: number;
  pendingSuggestions: number;
  pendingSuggestionsLabel: string;
  sharedChecklistLabel: string;
  sharedOpenTasks: number;
  title: string;
}

export function ManagerReadinessPanel({
  ariaLabel,
  myChecklistLabel,
  myOpenTasks,
  pendingSuggestions,
  pendingSuggestionsLabel,
  sharedChecklistLabel,
  sharedOpenTasks,
  title,
}: ManagerReadinessPanelProps) {
  return (
    <section className={`${overviewPanelClassName} ${overviewPanelHealthClassName}`} aria-label={ariaLabel}>
      <div className={overviewPanelTitleClassName}>
        <Icon name="check" />
        <h2>{title}</h2>
      </div>
      <div className={overviewHealthGridClassName}>
        <span><strong>{myOpenTasks}</strong> {myChecklistLabel}</span>
        <span><strong>{sharedOpenTasks}</strong> {sharedChecklistLabel}</span>
        <span><strong>{pendingSuggestions}</strong> {pendingSuggestionsLabel}</span>
      </div>
    </section>
  );
}

interface ManagerTaskChecklistPanelProps {
  addChecklistLabel: string;
  allLabel: string;
  allStatusesLabel: string;
  ariaLabel: string;
  doneLabel: string;
  emptyMessage: string;
  includeStopMeta?: boolean;
  includeTripKindMeta?: boolean;
  items: ItineraryItem[];
  mineLabel: string;
  onAddTask: () => void;
  onScopeFilterChange: (filter: TaskScopeFilter) => void;
  onStatusFilterChange: (filter: TaskStatusFilter) => void;
  onToggleTask: (task: TripTask) => void;
  openLabel: string;
  scopeFilter: TaskScopeFilter;
  scopeFilterLabel: string;
  statusFilter: TaskStatusFilter;
  statusFilterLabel: string;
  taskListLabels: OverviewTaskListLabels;
  tasks: TripTask[];
  title: string;
  trip: Trip;
  tripLabel: string;
}

export function ManagerTaskChecklistPanel({
  addChecklistLabel,
  allLabel,
  allStatusesLabel,
  ariaLabel,
  doneLabel,
  emptyMessage,
  includeStopMeta,
  includeTripKindMeta,
  items,
  mineLabel,
  onAddTask,
  onScopeFilterChange,
  onStatusFilterChange,
  onToggleTask,
  openLabel,
  scopeFilter,
  scopeFilterLabel,
  statusFilter,
  statusFilterLabel,
  taskListLabels,
  tasks,
  title,
  trip,
  tripLabel,
}: ManagerTaskChecklistPanelProps) {
  return (
    <section className={`${overviewPanelClassName} ${overviewTaskPanelClassName}`} aria-label={ariaLabel}>
      <div className={overviewPanelTitleClassName}>
        <Icon name="check" />
        <h2>{title}</h2>
      </div>
      <div className={overviewTaskToolbarClassName}>
        <SegmentedControl
          aria-label={scopeFilterLabel}
          className={overviewTaskFiltersClassName}
          selectedItemClassName={overviewTaskFilterActiveClassName}
          value={scopeFilter}
          options={[
            { value: "mine", label: mineLabel },
            { value: "trip", label: tripLabel },
            { value: "all", label: allLabel },
          ]}
          onChange={onScopeFilterChange}
        />
        <SegmentedControl
          aria-label={statusFilterLabel}
          className={overviewTaskFiltersClassName}
          selectedItemClassName={overviewTaskFilterActiveClassName}
          value={statusFilter}
          options={[
            { value: "all", label: allStatusesLabel },
            { value: "open", label: openLabel },
            { value: "done", label: doneLabel },
          ]}
          onChange={onStatusFilterChange}
        />
        <button className={overviewTaskAddButtonClassName} type="button" aria-label={addChecklistLabel} title={addChecklistLabel} onClick={onAddTask}>
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <OverviewTaskList
        tasks={tasks}
        trip={trip}
        items={items}
        labels={taskListLabels}
        emptyMessage={emptyMessage}
        includeTripKindMeta={includeTripKindMeta}
        includeStopMeta={includeStopMeta}
        onToggleTask={onToggleTask}
      />
    </section>
  );
}
